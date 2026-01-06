/**
 * Field Pattern Configuration
 *
 * This file defines all the text patterns used to identify field boundaries
 * in module specification documents. Multiple patterns per field handle
 * different form versions.
 *
 * Structure:
 * - name: Descriptive field identifier
 * - delimiter: Unicode character to replace the pattern with
 * - patterns: Array of text variations to match (order matters - first match wins)
 * - required: Set to false for optional fields (won't log warnings if not found)
 * - alternates: For patterns that need different delimiters
 */

// Patterns for textract output (preserves line breaks, used for description/outcomes)
const textractFields = [
  {
    name: 'description_end_with_newlines',
    delimiter: 'ꮥ',
    patterns: [
      'accessible to prospective students.\\n\\n',
      'accessible to prospective students.\\n',
      'accessible to prospective students.'
    ]
  },
  {
    name: 'description_start',
    delimiter: 'ꮤ',
    patterns: [
      'Module description'
    ]
  },
  {
    name: 'outcomes_start',
    delimiter: 'ꮦ',
    patterns: [
      '\\nQ\\n\\nModule outcomes:',
      '\\nQ\\nModule outcomes:',
      'Q\\n\\nModule outcomes:',
      'QModule outcomes:',
      'Module outcomes:'
    ]
  },
  {
    name: 'learning_outcomes_start',
    delimiter: 'ꮧ',
    patterns: [
      'By the end of the module students should be able to:\\n\\n',
      'By the end of the module students should be able to:\\n'
    ]
  },
  {
    name: 'formative_start',
    delimiter: 'ꮨ',
    patterns: [
      '\\n\\nOpportunities for formative assessment ',
      '\\nOpportunities for formative assessment '
    ]
  },
  {
    name: 'summative_example',
    delimiter: 'ꮫ',
    patterns: [
      'e.g. 1hr written unseen examination (50%), 1500 word essay (50%)\\n',
      'e.g. 1hr written unseen examination (50%), 500 word essay (10%), group presentation (40%), if required',
      'e.g. 2hr written unseen examination (50%), 1500 word essay (50%)'
    ]
  },
  {
    name: 'exam_section',
    delimiter: 'ꮬ',
    patterns: [
      'B Q\\n\\nIf there is an examination',
      'B Q\\n\\n\\nIf there is an examination',
      'B Q\\nIf there is an examination',
      'If there is an examination'
    ]
  },
  {
    name: 'reassessment_end',
    delimiter: 'ꮲ',
    patterns: [
      "meet the module's learning outcomes.\\n\\n",
      "meet the module's learning outcomes.\\n",
      "meet the module's learning outcomes."
    ]
  },
  {
    name: 'contact_section',
    delimiter: 'ꮳ',
    patterns: [
      '\\nB Q\\n\\nWill students come into contact',
      'Will students come into contact'
    ],
    isRegex: [true, false] // First pattern uses regex
  }
];

// Patterns for any-text reader output (main field extraction)
const readerFields = [
  // Year field
  {
    name: 'year_start',
    delimiter: '`',
    patterns: [
      'QDate of implementation (in terms of academic sessions)',
      'Date of implementation (in terms of academic sessions)'
    ]
  },
  {
    name: 'year_end_rationale',
    delimiter: '¬',
    patterns: [
      'BRationale',
      'Rationale'
    ]
  },

  // School field
  {
    name: 'school_start_alt',
    delimiter: '!',
    patterns: [
      'B1School/Institute that owns the module',
      '1School that owns the module',
      '1School that will own the module'
    ],
    required: false
  },
  {
    name: 'school_start',
    delimiter: '{',
    patterns: [
      'School/Institute that owns the module',
      'B1School that owns the module',
      'School that owns the module'
    ]
  },

  // Department field
  {
    name: 'department_start',
    delimiter: '[',
    patterns: [
      'BDepartment (if applicable)',
      'BDepartment(if applicable)',
      'B\n\nDepartment (if applicable)',
      'Department (if applicable)'
    ]
  },
  {
    name: 'department_alt',
    delimiter: '*',
    patterns: [
      'B2Department',
      '2Department'
    ],
    required: false
  },

  // Department end
  {
    name: 'department_end',
    delimiter: ']',
    patterns: [
      'BIs the',
      'B\n\nIs the',
      'Is the module delivered'
    ]
  },

  // Title field
  {
    name: 'title_start_alt1',
    delimiter: 'X',
    patterns: [
      '3Module title'
    ],
    required: false
  },
  {
    name: 'title_start',
    delimiter: 'ʓ',
    patterns: [
      'QModule title ',
      'N/AModule title',
      'Module title'
    ]
  },
  {
    name: 'title_start_alt2',
    delimiter: '𓏉',
    patterns: [
      'BModule title',
      'B3Module title'
    ],
    required: false
  },

  // Module code
  {
    name: 'code_start',
    delimiter: '#',
    patterns: [
      'B QModule code (if known)',
      'QModule code (if known)',
      'B QModule code(s) (if known)',
      'Module code(s) (if known)',
      'Module code(s) for existing module (if known and applicable)'
    ]
  },

  // Level
  {
    name: 'level_start',
    delimiter: '=',
    patterns: [
      'BModule level',
      'Module level'
    ]
  },

  // Credits
  {
    name: 'credits_start',
    delimiter: '@',
    patterns: [
      'B QModule credits ',
      'Module credits '
    ]
  },

  // Attribute
  {
    name: 'attribute_start',
    delimiter: '$',
    patterns: [
      'B QModule attribute',
      'Module attribute'
    ],
    required: false
  },

  // Semester
  {
    name: 'semester_start',
    delimiter: '⸮',
    patterns: [
      'B QSemester in which the module will run',
      'BSemester in which the module will run',
      'Semester in which the module will run'
    ]
  },
  {
    name: 'semester_end',
    delimiter: 'ﱙ',
    patterns: [
      'If delivered multiple times a year,',
      'BProgrammes on which the module is available (please state the programme title and code)'
    ]
  },

  // Compulsory/Optional
  {
    name: 'compulsory_start',
    delimiter: 'Ǖ',
    patterns: [
      'registered on this module code):'
    ]
  },
  {
    name: 'optional_start',
    delimiter: 'Ê',
    patterns: [
      'As an optional module:'
    ],
    required: false
  },
  {
    name: 'optional_end',
    delimiter: 'À',
    patterns: [
      'Confirmation that module registrations '
    ]
  },

  // Prerequisites
  {
    name: 'prerequisite_start',
    delimiter: 'Á',
    patterns: [
      'as well as attempted'
    ]
  },
  {
    name: 'prerequisite_end',
    delimiter: '☩',
    patterns: [
      'B13.2State if there is any other/prior',
      '13.2State if there is any other/prior',
      '13.1State if there is any other/prior'
    ],
    required: false
  },

  // Corequisites
  {
    name: 'corequisite_start',
    delimiter: 'Â',
    patterns: [
      'BState the name and code of any co-requisite modules on which students must also register in the same session',
      'State the name and code of any co-requisite modules on which students must also register in the same session'
    ]
  },

  // Campus
  {
    name: 'campus_start',
    delimiter: 'Ã',
    patterns: [
      'BWhere will the teaching take place? ',
      'BWhere will the teaching take place?',
      'Where will the teaching take place?'
    ]
  },
  {
    name: 'campus_end_delivery_notes',
    delimiter: 'Ä',
    patterns: [
      "If 'other' please state here:",
      'B Q SFComment briefly'
    ]
  },

  // Exemptions
  {
    name: 'exemptions_start',
    delimiter: 'Å',
    patterns: [
      'Please detail any exemptions from Regulations, including approved exceptions relating to the semesterised teaching year structure',
      'Please detail any exemptions from Regulations'
    ]
  },

  // Contact hours - Total
  {
    name: 'total_student',
    delimiter: 'Æ',
    patterns: [
      'QTotal student',
      'Total student'
    ]
  },

  // Lecture
  {
    name: 'lecture_start',
    delimiter: 'Ç',
    patterns: [
      'SF16.1Lecture',
      '19.1Lecture',
      'SFLecture',
      'Lecture'
    ]
  },

  // Seminar
  {
    name: 'seminar_start',
    delimiter: 'È',
    patterns: [
      '16.2Seminar',
      '19.2Seminar',
      'Seminar'
    ]
  },

  // Tutorial
  {
    name: 'tutorial_start',
    delimiter: 'É',
    patterns: [
      '16.3Tutorial',
      '19.3Tutorial',
      'Tutorial'
    ]
  },

  // Project supervision
  {
    name: 'supervision_start',
    delimiter: 'ꮛ',
    patterns: [
      '16.4Project supervision',
      '19.4Project supervision',
      'Project supervision'
    ]
  },

  // Demonstration
  {
    name: 'demonstration_start',
    delimiter: 'ꮜ',
    patterns: [
      '16.5Demonstration',
      '19.5Demonstration',
      'Demonstration'
    ]
  },

  // Practical
  {
    name: 'practical_start',
    delimiter: 'ꮝ',
    patterns: [
      '16.6Practical classes/workshops',
      '19.6Practical classes/workshops',
      'Practical classes/workshops'
    ]
  },

  // Lab
  {
    name: 'lab_start',
    delimiter: 'ꮞ',
    patterns: [
      '16.7Supervised time in a studio/workshop/lab',
      '19.7Supervised time in a studio/workshop/lab',
      'Supervised time in a studio/workshop/lab'
    ]
  },

  // Fieldwork
  {
    name: 'fieldwork_start',
    delimiter: 'ꮟ',
    patterns: [
      '16.8Fieldwork',
      '19.8Fieldwork',
      'Fieldwork'
    ]
  },

  // External visits
  {
    name: 'external_visits_start',
    delimiter: 'ꮠ',
    patterns: [
      '16.9External visits',
      '19.9External visits',
      'External visits'
    ]
  },

  // Work-based learning
  {
    name: 'work_based_start',
    delimiter: 'ꮡ',
    patterns: [
      '16.10Work based learning/placement',
      '19.10Work based learning/placement',
      'Work based learning/placement'
    ]
  },

  // Guided study
  {
    name: 'guided_study_start',
    delimiter: 'ꮢ',
    patterns: [
      '16.11Guided independent study',
      '19.11Guided independent study',
      'Guided independent study'
    ]
  },

  // Study abroad
  {
    name: 'study_abroad_start',
    delimiter: 'ꮣ',
    patterns: [
      '16.12Study abroad',
      '16.19Study abroad',
      'Study abroad'
    ]
  },

  // Description
  {
    name: 'description_start',
    delimiter: 'ꮤ',
    patterns: [
      'Module descriptionRecommended:',
      'Module description'
    ]
  },
  {
    name: 'description_end',
    delimiter: 'ꮥ',
    patterns: [
      'accessible to prospective students.'
    ]
  },

  // Outcomes
  {
    name: 'outcomes_start',
    delimiter: 'ꮦ',
    patterns: [
      'QModule outcomes:',
      'Module outcomes:'
    ]
  },
  {
    name: 'outcomes_benchmark',
    delimiter: 'ꮧ',
    patterns: [
      'Subject Benchmark Statements.'
    ]
  },

  // Formative assessment
  {
    name: 'formative_start',
    delimiter: 'ꮨ',
    patterns: [
      'Opportunities for formative assessment '
    ]
  },

  // Summative assessment
  {
    name: 'summative_start',
    delimiter: 'ꮩ',
    patterns: [
      'contributes to the overall module mark)'
    ]
  },

  // Coursework/exam weighting
  {
    name: 'coursework_weighting',
    delimiter: 'ɸ',
    patterns: [
      'If the module is wholly or partly assessed by coursework, please state the overall weighting:'
    ]
  },
  {
    name: 'exam_weighting',
    delimiter: '∏',
    patterns: [
      'QIf the module is wholly or partly assessed by examination, please state the overall weighting:'
    ]
  },
  {
    name: 'additional_summative',
    delimiter: 'Ŋ',
    patterns: [
      'Additional information on the method(s) of summative assessment'
    ]
  },
  {
    name: 'summative_method',
    delimiter: 'ꮪ',
    patterns: [
      'QMethod(s) of summative'
    ],
    required: false
  },
  {
    name: 'summative_example',
    delimiter: 'ꮫ',
    patterns: [
      'e.g. 1hr written unseen examination (50%), 1500 word essay (50%)',
      'e.g. 1hr written unseen examination (50%), 500 word essay (10%), group presentation (40%), if required',
      'e.g. 1hr written unseen examination (50%), 500-word essay (10%), group presentation (40%), if required'
    ]
  },

  // Exam details
  {
    name: 'exam_section',
    delimiter: 'ꮬ',
    patterns: [
      'B QIf there is an examination'
    ]
  },
  {
    name: 'exam_timetabled',
    delimiter: 'ꮭ',
    patterns: [
      'timetabled?'
    ]
  },
  {
    name: 'exam_length',
    delimiter: 'ꮮ',
    patterns: [
      "If 'yes' please specify the length of the examination:"
    ]
  },
  {
    name: 'exam_length_alt',
    delimiter: '𓋧',
    patterns: [
      "If 'yes' please specify the length of the examination:"
    ],
    required: false
  },
  {
    name: 'exam_period',
    delimiter: 'ꮯ',
    patterns: [
      'select examination period'
    ]
  },

  // Hurdles
  {
    name: 'hurdles_start',
    delimiter: 'ꮰ',
    patterns: [
      'BPlease describe any internal hurdles',
      'Please describe any internal hurdles'
    ]
  },

  // Reassessment
  {
    name: 'reassessment_start',
    delimiter: 'ꮱ',
    patterns: [
      'B QMethod(s) of reassessment',
      'Method(s) of reassessment'
    ]
  },
  {
    name: 'reassessment_end',
    delimiter: 'ꮲ',
    patterns: [
      "meet the module's learning outcomes."
    ]
  },

  // Contact/Lead
  {
    name: 'contact_section',
    delimiter: 'ꮳ',
    patterns: [
      'B QWill students come into contact'
    ]
  },
  {
    name: 'module_lead',
    delimiter: 'ꮴ',
    patterns: [
      'Module lead:',
      'Module leads:',
      'Module co-leads:'
    ]
  },
  {
    name: 'admin_contact',
    delimiter: 'ꮵ',
    patterns: [
      'School administrative contact',
      'School/Institute administrative contact'
    ]
  }
];

// HTML entity cleanup patterns (applied after field replacements)
const htmlCleanupPatterns = [
  { pattern: '&amp;', replacement: '&' },
  { pattern: '&lt;', replacement: '<' },
  { pattern: '&gt;', replacement: '>' },
  { pattern: '&quot;', replacement: '"' }
];

// Fallback patterns - applied if initial delimiter not found
const fallbackPatterns = [
  {
    checkDelimiter: 'ꮮ',
    patterns: [
      { pattern: "If 'yes' is this available for students to take overseas?", delimiter: 'ꮮ' },
      { pattern: 'BIf there is an examination,', delimiter: 'ꮮ' }
    ]
  },
  {
    checkDelimiter: 'Ä',
    patterns: [
      { pattern: 'B Q SFComment briefly', delimiter: 'Ä' }
    ]
  }
];

// Post-processing patterns for outcomes (clean up Birmingham-specific text)
const outcomesCleanupPatterns = [
  { pattern: 'ꮧ Schools/Institutes are also encouraged to refer to the Birmingham Graduate Attributes. ', replacement: 'ꮧ' },
  { pattern: 'ꮧ Schools are also encouraged to refer to the Birmingham Graduate Attributes. ', replacement: 'ꮧ' }
];

module.exports = {
  textractFields,
  readerFields,
  htmlCleanupPatterns,
  fallbackPatterns,
  outcomesCleanupPatterns
};
