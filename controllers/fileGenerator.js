const reader = require("any-text");
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const pify = require("pify");
const XLSX = require("xlsx");
const deptMapping = require("../mappings/dept.js");
const schoolMapping = require("../mappings/school.js");
const hecosMapping = require("../mappings/hecos.js");
const ccMapping = require("../mappings/cc.js");
const fieldPatterns = require("../mappings/fieldPatterns.js");
const collegeSchoolDeptMapping = require("../mappings/college_school_dept_mapping.json");

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Function to extract data from document with safe boundary checking
function extract(string, first, last) {
  const startIndex = string.indexOf(first);
  const endIndex = string.indexOf(last);

  // If either delimiter is not found, or end comes before start, return empty string
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return '';
  }

  return string.substring(startIndex + 1, endIndex);
}

/**
 * Apply field replacements from configuration with logging
 * @param {string} text - The text to process
 * @param {Array} fieldsConfig - Array of field configurations
 * @param {string} fileName - Name of file being processed (for logging)
 * @returns {string} - Text with patterns replaced by delimiters
 */
function applyFieldReplacements(text, fieldsConfig, fileName) {
  let result = text;
  const unmatchedFields = [];

  for (const field of fieldsConfig) {
    let matched = false;

    // Try each pattern variation (first match wins)
    for (const pattern of field.patterns) {
      if (result.includes(pattern)) {
        result = result.replace(pattern, field.delimiter);
        matched = true;
        break;
      }
    }

    // Track unmatched required fields
    if (!matched && field.required !== false) {
      unmatchedFields.push(field.name);
    }
  }

  // Log warnings for unmatched fields
  if (unmatchedFields.length > 0) {
    console.warn(`[${fileName}] Unmatched fields: ${unmatchedFields.join(', ')}`);
  }

  return result;
}

/**
 * Apply HTML cleanup patterns
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
function applyHtmlCleanup(text) {
  let result = text;
  for (const { pattern, replacement } of fieldPatterns.htmlCleanupPatterns) {
    // Replace all occurrences
    while (result.includes(pattern)) {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

/**
 * Apply fallback patterns if delimiter not found
 * @param {string} text - The text to process
 * @returns {string} - Text with fallback patterns applied
 */
function applyFallbackPatterns(text) {
  let result = text;

  for (const fallback of fieldPatterns.fallbackPatterns) {
    if (!result.includes(fallback.checkDelimiter)) {
      for (const { pattern, delimiter } of fallback.patterns) {
        if (result.includes(pattern)) {
          result = result.replace(pattern, delimiter);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Apply outcomes cleanup patterns
 * @param {string} text - The text to process
 * @returns {string} - Text with outcomes cleanup applied
 */
function applyOutcomesCleanup(text) {
  let result = text;
  for (const { pattern, replacement } of fieldPatterns.outcomesCleanupPatterns) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Normalize department name for fuzzy comparison
 * @param {string} name - Department name to normalize
 * @returns {string} - Normalized name
 */
function normalizeDeptName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^school of /i, '')
    .replace(/^institute of /i, '')
    .replace(/^department of /i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate word overlap score between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Overlap score between 0 and 1
 */
function wordOverlapScore(str1, str2) {
  const words1 = new Set(normalizeDeptName(str1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeDeptName(str2).split(' ').filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  return intersection.length / union.size;
}

/**
 * Find best fuzzy match for department name
 * @param {string} department - Department name to match
 * @param {Array} mapping - Department mapping array
 * @returns {Object|null} - Best match with item and score, or null if no good match
 */
function findFuzzyDeptMatch(department, mapping) {
  if (!department) return null;
  const normalized = normalizeDeptName(department);
  if (!normalized) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const item of mapping) {
    const longNorm = normalizeDeptName(item.Long);
    const shortNorm = normalizeDeptName(item.Short || '');

    // Check substring containment (either direction)
    if (longNorm && (longNorm.includes(normalized) || normalized.includes(longNorm))) {
      const score = Math.min(normalized.length, longNorm.length) /
                    Math.max(normalized.length, longNorm.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (shortNorm && (shortNorm.includes(normalized) || normalized.includes(shortNorm))) {
      const score = Math.min(normalized.length, shortNorm.length) /
                    Math.max(normalized.length, shortNorm.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // Check word overlap
    const overlapLong = wordOverlapScore(department, item.Long);
    if (overlapLong > bestScore) {
      bestScore = overlapLong;
      bestMatch = item;
    }

    if (item.Short) {
      const overlapShort = wordOverlapScore(department, item.Short);
      if (overlapShort > bestScore) {
        bestScore = overlapShort;
        bestMatch = item;
      }
    }
  }

  // Only return if score is above threshold (50%)
  if (bestMatch && bestScore >= 0.5) {
    return {
      item: bestMatch,
      score: bestScore
    };
  }
  return null;
}

/**
 * Validate that college, school, and department codes match according to the hierarchy mapping
 * @param {string} collegeCode - College code
 * @param {string} schoolCode - School code
 * @param {string} deptCode - Department code
 * @returns {Object|null} - Validation result with expected values if mismatch, or null if can't validate
 */
function validateHierarchy(collegeCode, schoolCode, deptCode) {
  if (!collegeCode || !schoolCode || !deptCode) return null;

  const match = collegeSchoolDeptMapping.find(
    m => m["College Code"] === collegeCode &&
         m["School Code"] === schoolCode &&
         m["Department Code"] === deptCode
  );

  if (match) return { valid: true };

  // Find what the correct values should be based on deptCode
  const byDept = collegeSchoolDeptMapping.find(m => m["Department Code"] === deptCode);
  if (byDept) {
    return {
      valid: false,
      expected: {
        collegeCode: byDept["College Code"],
        collegeName: byDept["College Description"],
        schoolCode: byDept["School Code"],
        schoolName: byDept["School Description"]
      },
      message: `Department ${deptCode} belongs to School ${byDept["School Code"]} (${byDept["School Description"]}), College ${byDept["College Code"]} (${byDept["College Description"]})`
    };
  }
  return null;
}

/**
 * Get filtered department options based on known school or college
 * Includes cascading data: subject, cc, jacs, hecos for each department
 * @param {string} schoolCode - School code (if known)
 * @param {string} collegeCode - College code (if known)
 * @returns {Array} - Array of department options with full data
 */
function getDeptOptions(schoolCode, collegeCode) {
  let filtered = collegeSchoolDeptMapping;

  if (schoolCode) {
    filtered = filtered.filter(m => m["School Code"] === schoolCode);
  } else if (collegeCode) {
    filtered = filtered.filter(m => m["College Code"] === collegeCode);
  }

  // Return unique departments WITH related data
  const uniqueDepts = [...new Map(filtered.map(m => [m["Department Code"], m])).values()];

  return uniqueDepts.map(m => {
    const deptCode = m["Department Code"];
    // Look up subject from deptMapping
    const deptInfo = deptMapping.find(d => d.Code === deptCode);
    // Look up hecos/jacs
    const hecosInfo = hecosMapping.find(h => h.Code === deptCode);
    // Look up cc
    const ccInfo = ccMapping.find(c => c["Banner - Dept Level5"] === deptCode);

    return {
      code: deptCode,
      name: m["Department Description"],
      schoolCode: m["School Code"],
      schoolName: m["School Description"],
      collegeCode: m["College Code"],
      collegeName: m["College Description"],
      subject: deptInfo?.Subject || '',
      hecos: hecosInfo?.HECoS || '',
      jacs: hecosInfo?.JACS || '',
      cc: ccInfo?.["New CC"] || ''
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get filtered school options based on known department or college
 * @param {string} deptCode - Department code (if known)
 * @param {string} collegeCode - College code (if known)
 * @returns {Array} - Array of school options with college info
 */
function getSchoolOptions(deptCode, collegeCode) {
  if (deptCode) {
    // Dept found - return the single school it belongs to
    const match = collegeSchoolDeptMapping.find(m => m["Department Code"] === deptCode);
    if (match) {
      return [{
        code: match["School Code"],
        name: match["School Description"],
        collegeCode: match["College Code"],
        collegeName: match["College Description"]
      }];
    }
  }

  let filtered = collegeSchoolDeptMapping;
  if (collegeCode) {
    filtered = filtered.filter(m => m["College Code"] === collegeCode);
  }

  // Return unique schools with college info sorted by name
  const unique = [...new Map(filtered.map(m => [
    m["School Code"],
    {
      code: m["School Code"],
      name: m["School Description"],
      collegeCode: m["College Code"],
      collegeName: m["College Description"]
    }
  ])).values()];

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all college options
 * @returns {Array} - Array of college options {code, name}
 */
function getCollegeOptions() {
  const unique = [...new Map(collegeSchoolDeptMapping.map(m => [
    m["College Code"],
    { code: m["College Code"], name: m["College Description"] }
  ])).values()];

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

async function createProgData(file) {
  const config = {
    preserveLineBreaks: true,
  };
  
  let text = await pify(textract.fromFileWithPath, { multiArgs: true })(
    file,
    config
    );

  text = JSON.stringify(text);

  // Get filename for logging
  const fileName = path.basename(file);

  // Apply textract field replacements (for description/outcomes with line breaks)
  let delimited1 = applyFieldReplacements(text, fieldPatterns.textractFields, fileName);

  const data = await reader.getText(file);

  // === STEP 1: Extract Year from FULL document (proposal section has the year) ===
  const yearPatterns = [
    { pattern: 'QDate of implementation (in terms of academic sessions)', delimiter: '`' },
    { pattern: 'Date of implementation (in terms of academic sessions)', delimiter: '`' }
  ];
  const yearEndPatterns = [
    { pattern: 'BRationale', delimiter: '¬' },
    { pattern: 'Rationale', delimiter: '¬' }
  ];

  let yearData = data;
  for (const p of yearPatterns) {
    if (yearData.includes(p.pattern)) {
      yearData = yearData.replace(p.pattern, p.delimiter);
      break;
    }
  }
  for (const p of yearEndPatterns) {
    if (yearData.includes(p.pattern)) {
      yearData = yearData.replace(p.pattern, p.delimiter);
      break;
    }
  }
  const yearExtracted = extract(yearData, '`', '¬').trim();
  console.log(`[${fileName}] Year extracted from full document: "${yearExtracted}"`);

  // === STEP 2: Find Module Specification section and process from there ===
  const moduleSpecMarker = "Module Specification";
  const moduleSpecIndex = data.indexOf(moduleSpecMarker);
  let dataToProcess = data;

  if (moduleSpecIndex !== -1) {
    console.log(`[${fileName}] Found "Module Specification" at position ${moduleSpecIndex}, processing from there`);
    dataToProcess = data.substring(moduleSpecIndex);
  } else {
    console.log(`[${fileName}] No "Module Specification" marker found, processing entire document`);
  }

  // Apply reader field replacements (main field extraction) - to spec section only
  let delimited = applyFieldReplacements(dataToProcess, fieldPatterns.readerFields, fileName);

  // Apply HTML cleanup
  delimited = applyHtmlCleanup(delimited);

  // Apply outcomes cleanup (Birmingham-specific text)
  delimited = applyOutcomesCleanup(delimited);

  // Apply fallback patterns for fields that might have alternative markers
  delimited = applyFallbackPatterns(delimited);

  // DEBUG: Log delimiter positions for school/department extraction
  console.log(`[${fileName}] Delimiter POSITIONS:`, {
    '{': delimited.indexOf('{'),
    '[': delimited.indexOf('['),
    ']': delimited.indexOf(']'),
    '*': delimited.indexOf('*'),
    '𓏉': delimited.indexOf('𓏉')
  });

  // DEBUG: Show text around the { delimiter to see what's happening
  const bracketPos = delimited.indexOf('{');
  const squarePos = delimited.indexOf('[');
  if (bracketPos !== -1) {
    console.log(`[${fileName}] Text around '{' (pos ${bracketPos}):`,
      delimited.substring(Math.max(0, bracketPos - 50), bracketPos + 100));
  }
  if (squarePos !== -1) {
    console.log(`[${fileName}] Text around '[' (pos ${squarePos}):`,
      delimited.substring(Math.max(0, squarePos - 50), squarePos + 100));
  }

  let courseworkWeighting = extract(delimited, "ɸ", "∏").trim() + "%";
  let examWeighting = extract(delimited, "∏", "Ŋ").trim() + "%";
  let examLength = extract(delimited, "ꮮ", "𓋧").trim();
  // Year is extracted from full document (proposal section) - use pre-extracted value
  let year = yearExtracted;
  let school = delimited.includes("*")
    ? extract(delimited, "{", "*").trim()
    : extract(delimited, "{", "[").trim();
  let department = delimited.includes("𓏉")
    ? extract(delimited, "[", "𓏉").trim()
    : extract(delimited, "[", "]").trim();

  // DEBUG: Log raw extracted values for school/department
  console.log(`[${fileName}] Raw extractions:`, {
    school,
    department,
    schoolUsedStar: delimited.includes("*"),
    departmentUsedAltDelim: delimited.includes("𓏉")
  });

  let title = extract(delimited, "ʓ", "#").trim();  
  let code = extract(delimited, "#", "=").trim();
  let level = extract(delimited, "=", "@").trim();  
  let credits = delimited.includes("$")
    ? extract(delimited, "@", "$").trim()
    : extract(delimited, "@", "⸮").trim();
  let semester = extract(delimited, "⸮", "ﱙ").trim();
  let compulsory = "";
  let optional = "";
  if (delimited.includes("Ǖ") && delimited.includes("Ê")) {
    compulsory = extract(delimited, "Ǖ", "Ê").trim();
  } else {
    compulsory = extract(delimited, "Ǖ", "À").trim();
  }
  if (delimited.includes("Ê") && delimited.includes("À")) {
    optional = extract(delimited, "Ê", "À").trim();
  } else {
    optional = "";
  }
  let prereq = delimited.includes("☩")
  ? extract(delimited, "Á", "☩").trim()
  : extract(delimited, "Á", "Â").trim();
  let coreq = extract(delimited, "Â", "Ã").trim();
  let campus = extract(delimited, "Ã", "Ä").trim();
  let exemptions = extract(delimited, "Å", "Æ").trim();
  let lecture = extract(delimited, "Ç", "È").trim();
  let seminar = extract(delimited, "È", "É").trim();
  let tutorial = extract(delimited, "É", "ꮛ").trim();
  let supervision = extract(delimited, "ꮛ", "ꮜ").trim();
  let demonstration = extract(delimited, "ꮜ", "ꮝ").trim();
  let practical = extract(delimited, "ꮝ", "ꮞ").trim();
  let lab = extract(delimited, "ꮞ", "ꮟ").trim();
  let fieldwork = extract(delimited, "ꮟ", "ꮠ").trim();
  let externalVisits = extract(delimited, "ꮠ", "ꮡ").trim();
  let workBased = extract(delimited, "ꮡ", "ꮢ").trim();
  let guided = extract(delimited, "ꮢ", "ꮣ").trim();
  let studyAbroad = extract(delimited, "ꮣ", "ꮤ").trim();
  let description = delimited1.includes("ꮥ")
    ? extract(delimited1, "ꮥ", "ꮦ").trim()
    : extract(delimited1, "ꮤ", "ꮦ").trim();
  let outcomes = extract(delimited1, "ꮧ", "ꮨ").trim();
  let formative = extract(delimited, "ꮩ", "ꮪ").trim();
  let summative = extract(delimited1, "ꮫ", "ꮬ").trim();
  // console.log(summative);
  let exam = extract(delimited, "ꮭ", "ꮮ").trim();
  let examPeriod = extract(delimited, "ꮯ", "ꮰ").trim();
  let hurdles = extract(delimited, "ꮰ", "ꮱ").trim();
  let reassessment = extract(delimited1, "ꮲ", "ꮳ").trim();
  let lead = extract(delimited, "ꮴ", "ꮵ").trim().replace("&amp;", "&");
  let deptCode = "";
  let schoolCode = "";
  let shortTitle = "";
  let subject = "";
  let college = "";
  let costCentre = "";
  let scheduleType =
    level.includes("LM") && credits >= 40
      ? "X"
      : !level.includes("LM") && credits >= 40
      ? "P"
      : "Z";
  let progLevel = level.includes("LM") ? "GT" : "UG";
  let jacs = "";
  let hecos = "";
  let cc = "";
  let semesterCode = "";
  let assessment = "";
  let campusCode = "";

  console.log("Campus extracted:", campus);

  // Semester Code (case-insensitive matching)
  const semesterLower = (semester || '').toLowerCase();

  if (semesterLower.includes('semester 1') || semesterLower.includes('delivered twice')) {
    semesterCode = "5";
  } else if (semesterLower.includes('semester 2')) {
    semesterCode = "6";
  } else if (semesterLower.includes('full term') || semesterLower.includes('full year')) {
    semesterCode = "1";
  } else if (semesterLower.includes('summer')) {
    semesterCode = "4";
  } else {
    semesterCode = "";
  }

  // Manipulation of the data
  // Year
  if (year.includes("2027")) {
    year = "002027";
  } else if (year.includes("2022")) {
    year = "002022";
  } else if (year.includes("2023")) {
    year = "002023";
  } else if (year.includes("2024")) {
    year = "002024";
  } else if (year.includes("2025") || year.includes("25/26")) {
    year = "002025";
  } else if (year.includes("2026") || year.includes("26/27")) {
    year = "002026";
  }

  // Credits

  if (credits.includes("non-credit")) {
    credits = "0";
  }

  credits = credits.replace(/\D/g, "");

  // Dept
  if (
    department.includes("Choose an item") ||
    department.includes("N/A") ||
    department.includes("NA")
  ) {
    department = school;
  }

  // DEBUG: Log mapping lookup inputs
  console.log(`[${fileName}] Mapping lookup inputs:`, {
    schoolInput: school,
    departmentInput: department,
    schoolMappingMatches: schoolMapping.filter((item) => item.School === school || item.School2 === school).length,
    deptMappingLongMatches: deptMapping.filter((item) => item.Long === department).length,
    deptMappingShortMatches: deptMapping.filter((item) => item.Short === department).length
  });

  // Track fuzzy suggestion for user approval
  let fuzzySuggestion = null;

  if (deptMapping.filter((item) => item.Long === department).length > 0) {
    // Exact match on Long
    const match = deptMapping.find((item) => item.Long === department);
    deptCode = match.Code;
    subject = match.Subject;
  } else if (deptMapping.filter((item) => item.Short === department).length > 0) {
    // Exact match on Short
    const match = deptMapping.find((item) => item.Short === department);
    deptCode = match.Code;
    subject = match.Subject;
  } else {
    // No exact match - try fuzzy matching
    const fuzzyResult = findFuzzyDeptMatch(department, deptMapping);
    if (fuzzyResult) {
      // Look up related values for the suggested department code
      const suggestedCode = fuzzyResult.item.Code;
      const suggestedHecosInfo = hecosMapping.filter((item) => item.Code === suggestedCode);
      const suggestedCcInfo = ccMapping.filter((item) => item["Banner - Dept Level5"] === suggestedCode);

      // Don't auto-apply, return as suggestion for user approval
      fuzzySuggestion = {
        field: 'department',
        original: department,
        suggested: fuzzyResult.item.Long,
        suggestedCode: suggestedCode,
        suggestedSubject: fuzzyResult.item.Subject,
        suggestedHecos: suggestedHecosInfo.length > 0 ? suggestedHecosInfo[0].HECoS : '',
        suggestedJacs: suggestedHecosInfo.length > 0 ? suggestedHecosInfo[0].JACS : '',
        suggestedCc: suggestedCcInfo.length > 0 ? suggestedCcInfo[0]["New CC"] : '',
        score: fuzzyResult.score
      };
      console.log(`[${fileName}] Fuzzy suggestion: "${department}" → "${fuzzyResult.item.Long}" (${(fuzzyResult.score * 100).toFixed(0)}% match)`);
    }
    deptCode = "";
  }

  // JACS and HECoS

  const subjects = hecosMapping.filter((item) => item.Code === deptCode);

  if (subjects.length > 0) {
    hecos = subjects[0].HECoS;
    jacs = subjects[0].JACS;
  }

  // Cost Centre

  const costCentreInfo = ccMapping.filter(
    (item) => item["Banner - Dept Level5"] === deptCode
  );
  if (costCentreInfo.length > 0) {
    cc = costCentreInfo[0]["New CC"];
  }

  // School

  if (
    schoolMapping.filter((item) => item.School === school).length > 0 ||
    schoolMapping.filter((item) => item.School2 === school).length > 0
  ) {
    schoolCode = schoolMapping.filter(
      (item) => item.School === school || item.School2 === school
    )[0].Code;
    college = schoolMapping.filter(
      (item) => item.School === school || item.School2 === school
    )[0].College;
  }

  
  // Level

  if (level.includes("Master")) {
    level = "LM";
  } else if (level.includes("Honours")) {
    level = "LH";
  } else if (level.includes("Intermediate")) {
    level = "LI";
  } else if (level.includes("Certificate")) {
    level = "LC";
  }
  

  // Campus code

  if (
    campus.includes("Edgbaston") ||
    campus === "Birmingham" ||
    campus === "UoB Campus Selly Oak" ||
    campus === "Shakespeare Institute"
  ) {
    campusCode = "B";
  } else if (campus.includes("Dubai")) {
    campusCode = "U";
  } else if (
    campus === "Joint Birmingham JNU Institute" ||
    campus === "Joint Institutions"
  ) {
    campusCode = "J";
  } else if (
    campus === "Singapore Institute of Management" ||
    campus === "Totally Taught Abroad"
  ) {
    campusCode = "R";
  } else if (
    campus === "Online" ||
    campus === "Distance" ||
    campus === "Distance Learning"
  ) {
    campusCode = "D";
  }

  // Long title

  if (
    title.includes("LF ") ||
    title.includes("LC ") ||
    title.includes("LI ") ||
    title.includes("LH ") ||
    title.includes("LM ")
  ) {
    title = title
    .replace("LF ", "")  
    .replace("LC ", "")
      .replace("LI ", "")
      .replace("LH ", "")
      .replace("LM ", "");
  }

  let longTitle = `${level} ${title}`;

  // Short title

  let characterLimit = 30;
  if (campusCode === "U") {
    characterLimit = 26;
  } else if (campusCode === "D") {
    characterLimit = 27;
  }
  let words = longTitle.split(" ");
  if (words.includes("and")) {
    // replace 'and' with '&' in words array
    words = words.map((word) => word.replace("and", "&"));
  }

  while (words.join(" ").length > characterLimit) {
    for (let i = 0; i < words.length; i++) {
      if (words.join(" ").length > characterLimit && words[i].length > 2) {
        words[i] = words[i].slice(0, words[i].length - 1);
      } else if (
        words.join(" ").length > characterLimit &&
        words.every((word) => word.length <= 2)
      ) {
        words.pop();
      }
    }
  }
  shortTitle = words.join(" ");

  if (campusCode === "U") {
    shortTitle = shortTitle + " Dub";
  } else if (campusCode === "D") {
    shortTitle = shortTitle + " DL";
  }

  // Contact hours

  function extractNumbers(str) {
    if (!str || typeof str !== 'string') return 0;
    const numbers = str.match(/\d+/g);
    // Return the first number found as an integer, or 0 if none found
    return numbers ? parseInt(numbers[0], 10) : 0;
  }

  lecture = extractNumbers(lecture);
  seminar = extractNumbers(seminar);
  tutorial = extractNumbers(tutorial);
  supervision = extractNumbers(supervision);
  demonstration = extractNumbers(demonstration);
  practical = extractNumbers(practical);
  lab = extractNumbers(lab);
  fieldwork = extractNumbers(fieldwork);
  externalVisits = extractNumbers(externalVisits);
  workBased = extractNumbers(workBased);
  guided = extractNumbers(guided);
  studyAbroad = extractNumbers(studyAbroad);

  // Description

  if (!description.includes("<br>")) {
    description = description
      .replace(/\\n/g, "<br>")      
      .replace(/<br><br><br><br>/g, "<br><br>")
      .replace(/<br><br><br>/g, "<br><br>");
  }

  // Learning outcomes

  if (!outcomes.includes("<li>")) {
    outcomes = `By the end of the module students should be able to:<ul><li>${outcomes}`;
    outcomes = outcomes
      .replace(/\\n\\n/g, "</li><li>")
      .replace(/<\/li><li>\/li><li>/g, "</li><li>")
      .replace(/<\/li><li>\/li><\/ul>/g, "</li></ul>");

    outcomes = outcomes.replace(/\\n/g, "</li><li>");

    outcomes = outcomes.replace("18.1", "");
    outcomes = outcomes.replace("18.2", "");
    outcomes = outcomes.replace("18.3", "");
    outcomes = outcomes.replace("18.4", "");
    outcomes = outcomes.replace("18.5", "");
    outcomes = outcomes.replace("18.6", "");
    outcomes = outcomes.replace("18.7", "");
    outcomes = outcomes.replace("18.8", "");
    outcomes = outcomes.replace("18.9", "");
    outcomes = outcomes.replace("18.10", "");
    outcomes = outcomes.replace("18.11", "");
    outcomes = outcomes.replace("18.12", "");
    outcomes = outcomes.replace("18.13", "");
    outcomes = outcomes.replace("18.14", "");
    outcomes = outcomes.replace("18.15", "");
    outcomes = outcomes.replace("20.1", "");
    outcomes = outcomes.replace("20.2", "");
    outcomes = outcomes.replace("20.3", "");
    outcomes = outcomes.replace("20.4", "");
    outcomes = outcomes.replace("20.5", "");
    outcomes = outcomes.replace("20.6", "");
    outcomes = outcomes.replace("20.7", "");
    outcomes = outcomes.replace("20.8", "");
    outcomes = outcomes.replace("20.9", "");
    outcomes = outcomes.replace("20.10", "");
    outcomes = outcomes.replace("20.11", "");
    outcomes = outcomes.replace("20.12", "");
    outcomes = outcomes.replace("20.13", "");
    outcomes = outcomes.replace("20.14", "");
    outcomes = outcomes.replace("20.15", "");
    outcomes = outcomes.replace("21.1", "");
    outcomes = outcomes.replace("21.2", "");
    outcomes = outcomes.replace("21.3", "");
    outcomes = outcomes.replace("21.4", "");
    outcomes = outcomes.replace("21.5", "");
    outcomes = outcomes.replace("21.6", "");
    outcomes = outcomes.replace("21.7", "");
    outcomes = outcomes.replace("21.8", "");
    outcomes = outcomes.replace("21.9", "");
    outcomes = outcomes.replace("21.10", "");
    outcomes = outcomes.replace("21.11", "");
    outcomes = outcomes.replace("21.12", "");
    outcomes = outcomes.replace("21.13", "");
    outcomes = outcomes.replace("21.14", "");
    outcomes = outcomes.replace("21.15", "");
    outcomes = outcomes
    outcomes = outcomes
    .replace(/\\n\\n/g, "</li><li>")
    .replace(/<ul><li>\s*<\/li><li>/g, "<ul><li>")
    .replace(/<\/li><li>\s*<\/li><li>/g, "</li><li>")
    .replace(/<\/li><li>\s*<\/li><\/ul>/g, "</li></ul>")    
    .replace(/<li>(\s|&nbsp;|&#160;)*<\/li>/gi, ""); // final sweep
  

    
    outcomes = outcomes.replace("19</li><li>", "</li></ul>");

    outcomes = outcomes + "</li></ul>";
    outcomes = outcomes.replace(/<\/li><li><\/li><\/ul>/g, "</li></ul>")
    // console.log(outcomes);
  }

  // Assessment

  summative = summative.replace(/\\n/g, "<br>");  
  reassessment = reassessment.replace(/\\n/g, "<br>");
  assessment = `<strong>Assessment:</strong><br><br>${summative}<br><br><strong>Reassessment:</strong><br><br>${reassessment}`;
  assessment = assessment
    .replace(/&amp;/g, "&")
    .replace(/<br><br><br><br>/g, "<br><br>")
    .replace("<br><br><br><br>", "<br><br>");
  assessment = assessment.replace(/<br><br><br>/g, "<br><br>");

  // Validate hierarchy after all mappings are done
  const hierarchyValidation = validateHierarchy(college, schoolCode, deptCode);
  const hasHierarchyMismatch = hierarchyValidation?.valid === false;

  // Determine if we need to show dropdown options for missing values
  const missingDept = !deptCode;
  const missingSchool = !schoolCode;

  // Include all dropdown options if there's a hierarchy mismatch (so user can correct any field)
  // or if the specific field is missing
  const needsDeptOptions = missingDept || hasHierarchyMismatch;
  const needsSchoolOptions = missingSchool || hasHierarchyMismatch;
  const needsCollegeOptions = hasHierarchyMismatch;

  const data2 = {
    year,
    subject,
    school,
    schoolCode,
    department,
    deptCode,
    college,
    title,
    shortTitle,
    longTitle,
    code,
    level,
    credits,
    progLevel,
    scheduleType,
    cc,
    jacs,
    hecos,
    compulsory,
    optional,
    prereq,
    coreq,
    campus,
    campusCode,
    exemptions,
    lecture,
    seminar,
    tutorial,
    supervision,
    demonstration,
    practical,
    lab,
    fieldwork,
    externalVisits,
    workBased,
    guided,
    studyAbroad,
    description,
    outcomes,
    formative,
    summative,
    exam,
    examPeriod,
    hurdles,
    reassessment,
    assessment,
    semester,
    semesterCode,
    lead,
    fuzzySuggestion,
    // Hierarchy validation and dropdown options
    hierarchyMismatch: hasHierarchyMismatch ? hierarchyValidation : null,
    missingDept,
    missingSchool,
    deptOptions: needsDeptOptions ? getDeptOptions(schoolCode, college) : null,
    schoolOptions: needsSchoolOptions ? getSchoolOptions(deptCode, college) : null,
    collegeOptions: needsCollegeOptions ? getCollegeOptions() : null,
  };
  // console.log(data2);
  return data2;
  //   });
}

async function text(req, res, next) {
  const sessionId = req.query.sessionId;
  const filePaths = [];

  // Determine which directory to use
  let uploadDir;
  if (sessionId) {
    // Validate session ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    uploadDir = path.join(UPLOADS_DIR, sessionId);
  } else {
    // Fallback to legacy directory for backward compatibility
    uploadDir = path.join(__dirname, "../client/build");
  }

  // Check if directory exists
  if (!fs.existsSync(uploadDir)) {
    return res.status(404).json({ error: 'Upload session not found. Please upload files first.' });
  }

  // Find all .docx files in the directory
  try {
    const files = fs.readdirSync(uploadDir);
    files.forEach((file) => {
      if (path.extname(file).toLowerCase() === ".docx") {
        filePaths.push(path.join(uploadDir, file));
      }
    });
  } catch (err) {
    console.error('Error reading upload directory:', err.message);
    return res.status(500).json({ error: 'Failed to read upload directory' });
  }

  if (filePaths.length === 0) {
    return res.status(404).json({ error: 'No .docx files found. Please upload Word documents first.' });
  }

  const finalData = [];
  const errors = [];

  try {
    for (let i = 0; i < filePaths.length; i++) {
      const file = filePaths[i];
      try {
        const obj = await createProgData(file);
        finalData.push(obj);
      } catch (fileErr) {
        console.error(`Error processing ${path.basename(file)}:`, fileErr.message);
        errors.push({
          fileName: path.basename(file),
          error: fileErr.message
        });
      }
    }

    if (finalData.length === 0) {
      return res.status(500).json({
        error: 'Failed to process any files',
        details: errors
      });
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(finalData);
    // Create workbook
    const wb = XLSX.utils.book_new();
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Determine output path
    const outputPath = sessionId
      ? path.join(uploadDir, "output.xlsx")
      : path.join(__dirname, "..", "output.xlsx");

    // Write workbook
    XLSX.writeFile(wb, outputPath);

    // Verify file was created
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: 'Failed to create output file' });
    }

    // Include session ID and any errors in response
    const response = {
      data: finalData,
      sessionId: sessionId || null,
      filesProcessed: finalData.length,
      errors: errors.length > 0 ? errors : undefined
    };

    res.status(200).json(finalData);
  } catch (err) {
    console.error('Error generating data:', err.message);
    return res.status(500).json({
      error: 'Failed to process files',
      details: err.message
    });
  }
}

module.exports = text;
