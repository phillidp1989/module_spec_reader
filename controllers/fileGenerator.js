const reader = require("any-text");
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const pify = require("pify");
if (typeof XLSX == "undefined") XLSX = require("xlsx");
const deptMapping = require("../mappings/dept.js");
const schoolMapping = require("../mappings/school.js");
const hecosMapping = require("../mappings/hecos.js");
const ccMapping = require("../mappings/cc.js");

// Function to extract data from document
function extract(string, first, last) {
  return string.substring(string.indexOf(first) + 1, string.indexOf(last));
}

async function createProgData(file) {
  const config = {
    preserveLineBreaks: true,
  };

  let text = await pify(textract.fromFileWithPath, { multiArgs: true })(
    file,
    config
  );

  //   textract.fromFileWithPath(file, config, async function (error, text, final) {

  text = JSON.stringify(text);

  let delimited1 = text
    // Description start
    .replace("accessible to prospective students.\\n\\n", "ꮥ")
    .replace("accessible to prospective students.\\n", "ꮥ")
    // Description end
    .replace("\\nQ\\n\\nModule outcomes:", "ꮦ")
    .replace("\\nQ\\nModule outcomes:", "ꮦ")
    .replace("Q\\n\\nModule outcomes:", "ꮦ")
    // Learning outcomes start
    .replace("By the end of the module students should be able to:\\n\\n", "ꮧ")
    .replace("By the end of the module students should be able to:\\n", "ꮧ")
    // Learning outcomes end
    .replace("\\n\\nOpportunities for formative assessment ", "ꮨ")
    .replace("\\nOpportunities for formative assessment ", "ꮨ")
    //   Summative assessment start
    .replace(
      "e.g. 1hr written unseen examination (50%), 1500 word essay (50%)\\n",
      "ꮫ"
    )
    .replace(
      "e.g. 1hr written unseen examination (50%), 500 word essay (10%), group presentation (40%), if required",
      "ꮫ"
    )
    //   Summative assessment end
    .replace("B Q\\n\\nIf there is an examination", "ꮬ")
    .replace("B Q\\n\\n\\nIf there is an examination", "ꮬ")
    .replace("B Q\\nIf there is an examination", "ꮬ")
    // Reassessment start
    .replace("meet the module's learning outcomes.\\n", "ꮲ")
    .replace("meet the module’s learning outcomes.\\n\\n", "ꮲ")
    // Reassessment end
    .replace(/\\nB Q\\n\\nWill students come into contact/, "ꮳ");
  // .replace("B Q\\n\\nWill students come into contact", "ꮳ")
  // .replace("B Q\\nWill students come into contact", "ꮳ")

  const data = await reader.getText(file);

  // console.log(data);

  let delimited = data
    .replace("QDate of implementation (in terms of academic sessions)", "`")
    .replace("BRationale", "¬")
    .replace("B1School/Institute that owns the module", "{")
    .replace("School/Institute that owns the module", "{")
    .replace("B2Department (if applicable)", "[")
    .replace("BDepartment (if applicable)", "[")
    .replace("BDepartment(if applicable)", "[")
    .replace("BIs the", "]")
    .replace("&amp;", "&")
    .replace("QModule title ", "ʓ")
    .replace("BModule title", "𓏉")
    .replace("B3Module title", "𓏉")
    .replace("B QModule code (if known)", "#")
    .replace("QModule code (if known)", "#")
    .replace("B QModule code(s) (if known)", "#")
    .replace("B QModule code (if known)", "#")
    .replace("BModule level", "=")
    .replace("B QModule credits ", "@")
    .replace("B QModule attribute", "$")
    .replace("B QSemester in which the module will run", "⸮")
    .replace("BSemester in which the module will run", "⸮")
    .replace(
      "BProgrammes on which the module is available (please state the programme title and code)",
      "ﱙ"
    )
    .replace("registered on this module code):", "Ǖ")
    .replace("As an optional module:", "Ê")
    .replace("Confirmation that module registrations ", "À")
    .replace("exchange students, if applicable)", "Á")
    .replace("as well as attempted", "Á")
    .replace(
      "B13.2State if there is any other/prior",
      "☩"
    )
    .replace(
      "BState the name and code of any co-requisite modules on which students must also register in the same session",
      "Â"
    )
    .replace(
      "State the name and code of any co-requisite modules on which students must also register in the same session",
      "Â"
    )
    .replace("BWhere will the teaching take place? ", "Ã")
    .replace("BWhere will the teaching take place?", "Ã")
    .replace("If ‘other’ please state here:", "Ä")
    .replace("B Q SFComment briefly", "Ä")
    .replace(
      "Please detail any exemptions from Regulations, including approved exceptions relating to the semesterised teaching year structure",
      "Å"
    )
    .replace("Please detail any exemptions from Regulations", "Å")
    .replace("QTotal student", "Æ")
    .replace("SF16.1Lecture", "Ç")
    .replace("SFLecture", "Ç")
    .replace("16.2Seminar", "È")
    .replace("Seminar", "È")
    .replace("16.3Tutorial", "É")
    .replace("Tutorial", "É")
    .replace("16.4Project supervision", "ꮛ")
    .replace("Project supervision", "ꮛ")
    .replace("16.5Demonstration", "ꮜ")
    .replace("Demonstration", "ꮜ")
    .replace("16.6Practical classes/workshops", "ꮝ")
    .replace("Practical classes/workshops", "ꮝ")
    .replace("16.7Supervised time in a studio/workshop/lab", "ꮞ")
    .replace("Supervised time in a studio/workshop/lab", "ꮞ")
    .replace("16.8Fieldwork", "ꮟ")
    .replace("Fieldwork", "ꮟ")
    .replace("16.9External visits", "ꮠ")
    .replace("External visits", "ꮠ")
    .replace("16.10Work based learning/placement", "ꮡ")
    .replace("Work based learning/placement", "ꮡ")
    .replace("16.11Guided independent study", "ꮢ")
    .replace("Guided independent study", "ꮢ")
    .replace("16.12Study abroad", "ꮣ")
    .replace("Study abroad", "ꮣ")
    .replace("Module descriptionRecommended:", "ꮤ")
    .replace("Module description", "ꮤ")
    .replace("accessible to prospective students.", "ꮥ")
    .replace("QModule outcomes:", "ꮦ")
    .replace("Subject Benchmark Statements.", "ꮧ")
    .replace(
      "ꮧ Schools/Institutes are also encouraged to refer to the Birmingham Graduate Attributes. ",
      "ꮧ"
    )
    .replace("Opportunities for formative assessment ", "ꮨ")
    .replace("contributes to the overall module mark)", "ꮩ")
    .replace(
      "If the module is wholly or partly assessed by coursework, please state the overall weighting:",
      "ɸ"
    )
    .replace(
      "QIf the module is wholly or partly assessed by examination, please state the overall weighting:",
      "∏"
    )
    .replace(
      "Additional information on the method(s) of summative assessment",
      "Ŋ"
    )
    .replace("QMethod(s) of summative", "ꮪ")
    .replace(
      "e.g. 1hr written unseen examination (50%), 1500 word essay (50%)",
      "ꮫ"
    )
    .replace(
      "e.g. 1hr written unseen examination (50%), 500 word essay (10%), group presentation (40%), if required",
      "ꮫ"
    )
    .replace("B QIf there is an examination", "ꮬ")
    .replace("timetabled?", "ꮭ")
    .replace("If ‘yes’ please specify the length of the examination:", "ꮮ")
    .replace("If ‘yes’ please specify the length of the examination:", "𓋧")
    .replace("select examination period", "ꮯ")
    .replace("BPlease describe any internal hurdles", "ꮰ")
    .replace("B QMethod(s) of reassessment", "ꮱ")
    .replace("meet the module’s learning outcomes.", "ꮲ")
    .replace("B QWill students come into contact", "ꮳ")
    .replace("Module lead:", "ꮴ")
    .replace("School/Institute administrative contact", "ꮵ")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&amp;", "&")
    .replace("&amp;", "&")
    .replace("&quot;", '"');

  if (!delimited.includes("ꮮ")) {
    delimited = delimited.replace(
      "If ‘yes’ is this available for students to take overseas?",
      "ꮮ"
    );
  }

  if (!delimited.includes("ꮮ")) {
    delimited = delimited.replace("BIf there is an examination,", "ꮮ");
  }
  if (!delimited.includes("Ä")) {
    delimited = delimited.replace("B Q SFComment briefly", "Ä");
  }

  let courseworkWeighting = extract(delimited, "ɸ", "∏").trim() + "%";
  let examWeighting = extract(delimited, "∏", "Ŋ").trim() + "%";
  let examLength = extract(delimited, "ꮮ", "𓋧").trim();
  let year = extract(delimited, "`", "¬").trim();
  let school = extract(delimited, "{", "[").trim();
  let department = delimited.includes("𓏉")
    ? extract(delimited, "[", "𓏉").trim()
    : extract(delimited, "[", "]").trim();
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

  // Semester Code

  switch (semester) {
    case "Semester 1":
      semesterCode = "5";
      break;
    case "Semester 2":
      semesterCode = "6";
      break;
    case "Full Term":
      semesterCode = "1";
      break;
    case "Summer Period":
      semesterCode = "4";
      break;
    case "Delivered twice in ac. year (semester 1 and 2)":
      semesterCode = "5";
      break;
    default:
      semesterCode = "";
      break;
  }

  // Manipulation of the data
  // Year
  if (year.includes("2021")) {
    year = "002021";
  } else if (year.includes("2022")) {
    year = "002022";
  } else if (year.includes("2023")) {
    year = "002023";
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

  if (deptMapping.filter((item) => item.Long === department).length > 0) {
    deptCode = deptMapping.filter((item) => item.Long === department)[0].Code;
    subject = deptMapping.filter((item) => item.Long === department)[0].Subject;
  } else if (
    deptMapping.filter((item) => item.Short === department).length > 0
  ) {
    deptCode = deptMapping.filter((item) => item.Short === department)[0].Code;
    subject = deptMapping.filter((item) => item.Short === department)[0]
      .Subject;
  } else {
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
    title.includes("LC ") ||
    title.includes("LI ") ||
    title.includes("LH ") ||
    title.includes("LM ")
  ) {
    title = title
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
    let numbers = str.match(/\d+/g);
    return numbers ? numbers.join(" ") : "";
  }

  lecture = Math.round(extractNumbers(lecture));
  seminar = Math.round(extractNumbers(seminar));
  tutorial = Math.round(extractNumbers(tutorial));
  supervision = Math.round(extractNumbers(supervision));
  demonstration = Math.round(extractNumbers(demonstration));
  practical = Math.round(extractNumbers(practical));
  lab = Math.round(extractNumbers(lab));
  fieldwork = Math.round(extractNumbers(fieldwork));
  externalVisits = Math.round(extractNumbers(externalVisits));
  workBased = Math.round(extractNumbers(workBased));
  guided = Math.round(extractNumbers(guided));
  studyAbroad = Math.round(extractNumbers(studyAbroad));

  // Description

  if (!description.includes("<br>")) {
    description = description
      .replace(/\\n/g, "<br>")
      .replace(/<br><br><br>/g, "<br><br>")
      .replace(/<br><br><br><br>/g, "<br><br>");
  }

  // Learning outcomes

  if (!outcomes.includes("<li>")) {
    outcomes = `By the end of the module students should be able to:<ul><li>${outcomes}`;
    outcomes = outcomes
      .replace(/\\n\\n/g, "</li><li>")
      .replace(/<\/li><li>\/li><li>/g, "</li><li>");

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
    outcomes = outcomes.replace("19</li><li>", "</li></ul>");

    outcomes = outcomes + "</li></ul>";
  }

  // Assessment

  summative = summative.replace(/\\n/g, "<br>");
  reassessment = reassessment.replace(/\\n/g, "<br>");
  assessment = `<strong>Assessment:</strong><br><br>${summative}<br><br><strong>Reassessment:</strong><br><br>${reassessment}`;
  assessment = assessment
    .replace(/&amp;/g, "&")
    .replace(/<br><br><br><br>/g, "<br><br>");
  assessment = assessment.replace(/<br><br><br>/g, "<br><br>");

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
  };
  // console.log(data2);
  return data2;
  //   });
}

async function text(req, res, next) {
  const filePaths = [];

  fs.readdirSync(path.join(__dirname, "../client/build")).forEach((file) => {
    if (path.extname(file) === ".docx") {
      filePaths.push(path.join(__dirname, "../client/build", file));
    }
  });
  let finalData = [];
  try {
    for (let i = 0; i < filePaths.length; i++) {
      const file = filePaths[i];
      const obj = await createProgData(file);
      finalData.push(obj);
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(finalData);
    // Create workbook
    const wb = XLSX.utils.book_new();
    //Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // Write workbook
    XLSX.writeFile(wb, "output.xlsx");
    res.status(200).json(finalData);
  } catch (err) {
    console.log("here");
    next(err);
  }

  // console.log(delimited);

  // console.log(year);
  // console.log(school);
  // console.log(department);
  // console.log(title);
  // console.log(code);
  // console.log(level);
  // console.log(credits);
  // console.log(semester);
  // console.log(compulsory);
  // console.log(optional);
  // console.log(prereq);
  // console.log(coreq);
  // console.log(campus);
  // console.log(exemptions);
  // console.log(lecture);
  // console.log(seminar);
  // console.log(tutorial);
  // console.log(supervision);
  // console.log(demonstration);
  // console.log(practical);
  // console.log(lab);
  // console.log(fieldwork);
  // console.log(externalVisits);
  // console.log(workBased);
  // console.log(guided);
  // console.log(studyAbroad);
  // console.log(description);
  // console.log(outcomes);
  // console.log(formative);
  // console.log(summative);
  // console.log(exam);
  // console.log(examPeriod);
  // console.log(hurdles);
  // console.log(reassessment);
  // console.log(lead);
}

module.exports = text;
