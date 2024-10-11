const deptMapping = [
    {
        "Code": "013",
        "Long": "School of Chemical Engineering",
        "Short": "Chemical Engineering",
        "Subject": '04',
    },
    {
        "Code": "014",
        "Long": "School of Chemistry",
        "Short": "Chemistry",
        "Subject": '03',
    },
    {
        "Code": "015",
        "Long": "Civil Engineering",
        "Short": "Civil Engineering",
        "Subject": '04',
    },
    {
        "Code": "016",
        "Long": "School of Computer Science",
        "Short": "Computer Science",
        "Subject": '06',
    },
    {
        "Code": "018",
        "Long": "School of Dentistry",
        "Short": "Dentistry",
        "Subject": '01',
    },
    {
        "Code": "019",
        "Long": "Earth and Environmental Sciences",
        "Short": "Earth and Environ Sciences",
        "Subject": '03',
    },
    {
        "Code": "020",
        "Long": "School of Education",
        "Short": "School of Education",
        "Subject": '11',
    },
    {
        "Code": "021",
        "Long": "Electronic, Electrical and Systems Engineering",
        "Short": "Elec, Elec & Sys Engineering",
        "Subject": '04',
    },
    {
        "Code": "022",
        "Long": "Geography",
        "Short": "Geography",
        "Subject": '03',
    },
    {
        "Code": "023",
        "Long": "School of Nursing",
        "Short": "Nursing",
        "Subject": '02',
    },
    {
        "Code": "027",
        "Long": "Birmingham Law School",
        "Short": "Law",
        "Subject": '08',
    },
    {
        "Code": "028",
        "Long": "Mechanical Engineering",
        "Short": "Mechanical Engineering",
        "Subject": '04',
    },
    {
        "Code": "029",
        "Long": "School of Mathematics",
        "Short": "Mathematics",
        "Subject": '06',
    },
    {
        "Code": "031",
        "Long": "School of Metallurgy and Materials",
        "Short": "Metallurgy & Materials",
        "Subject": '04',
    },
    {
        "Code": "032",
        "Long": "School of Physics and Astronomy",
        "Short": "Physics & Astronomy",
        "Subject": '03',
    },
    {
        "Code": "033",
        "Long": "School of Psychology",
        "Short": "School of Psychology",
        "Subject": '03',
    },
    {
        "Code": "036",
        "Long": "School of Sport, Exercise and Rehabilitation Sciences",
        "Short": "Sport, Ex and Rehab Sciences",
        "Subject": '03',
    },
    {
        "Code": "038",
        "Long": "School of Biosciences",
        "Short": "School of Biosciences",
        "Subject": '03',
    },
    {
        "Code": "039",
        "Long": "Centre for Learning and Academic Development",
        "Short": "Centre for Learning & Acad Dev",
        "Subject": '11',
    },
    {
        "Code": "106",
        "Long": "Institute of Cardiovascular Sciences",
        "Short": "Inst of Card Sciences",
        "Subject": '02',
    },
    {
        "Code": "108",
        "Long": "African Studies and Anthropology",
        "Short": "African Studies & Anthropology",
        "Subject": '09',
    },
    {
        "Code": "113",
        "Long": "International Development",
        "Short": "International Development",
        "Subject": '08',
    },
    {
        "Code": "114",
        "Long": "Drama and Theatre Arts",
        "Short": "Drama and Theatre Arts",
        "Subject": '10',
    },
    {
        "Code": "115",
        "Long": "Economics",
        "Short": "Economics",
        "Subject": '07',
    },
    {
        "Code": "122",
        "Long": "Health Services Management Centre",
        "Short": "Health Services Management Cen",
        "Subject": '08',
    },
    {
        "Code": "124",
        "Long": "Department of Art History, Curating and Visual Studies",
        "Short": "Art Hist, Cur and Vis Studies",
        "Subject": '09',
    },
    {
        "Code": "128",
        "Long": "Institute of Cancer and Genomic Sciences",
        "Short": "Inst of Cancer / Genomic Sci",
        "Subject": '02',
    },
    {
        "Code": "131",
        "Long": "Institute of Local Government Studies",
        "Short": "Inst Local Government Studies",
        "Subject": '08',
    },
    {
        "Code": "134",
        "Long": "Music",
        "Short": "Music",
        "Subject": '10',
    },
    {
        "Code": "140",
        "Long": "Philosophy",
        "Short": "Philosophy",
        "Subject": '09',
    },
    {
        "Code": "142",
        "Long": "Political Science and International Studies",
        "Short": "Political Sci & Intern'tl Stud",
        "Subject": '08',
    },
    {
        "Code": "150",
        "Long": "Theology and Religion",
        "Short": "Theology and Religion",
        "Subject": '09',
    },
    {
        "Code": "153",
        "Long": "Languages for All",
        "Short": "Languages for All",
        "Subject": '09',
    },
    {
        "Code": "171",
        "Long": "Shakespeare Institute",
        "Short": "Shakespeare Institute",
        "Subject": '09',
    },
    {
        "Code": "173",
        "Long": "Institute of Immunology and Immunotherapy",
        "Short": "Inst of Immunol + Immunoth",
        "Subject": '02',
    },
    {
        "Code": "182",
        "Long": "Personal Skills Award",
        "Short": "PSA",
        "Subject": '11',
    },
    {
        "Code": "184",
        "Long": "LES - College Hub",
        "Short": "LES - College Hub",
        "Subject": '03',
    },
    {
        "Code": "188",
        "Long": "Ironbridge International Institute for Cultural Heritage",
        "Short": "Ironbridge Int Inst & Cul Her",
        "Subject": '09',
    },
    {
        "Code": "193",
        "Long": "CAL - College Hub",
        "Short": "CAL - College Hub",
        "Subject": '09',
    },
    {
        "Code": "197",
        "Long": "Marketing",
        "Short": "Marketing",
        "Subject": '07',
    },
    {
        "Code": "200",
        "Long": "COS - College Hub",
        "Short": "COS - College Hub",
        "Subject": '08',
    },
    {
        "Code": "202",
        "Long": "EPS - College Hub",
        "Short": "EPS - College Hub",
        "Subject": '04',
    },
    {
        "Code": "204",
        "Long": "School of Biomedical Sciences",
        "Short": "Biomedical Sciences",
        "Subject": '03',
    },
    {
        "Code": "205",
        "Long": "School of Pharmacy",
        "Short": "Pharmacy",
        "Subject": '01',
    },
    {
        "Code": "207",
        "Long": "MDS - College Hub",
        "Short": "MDS - College Hub",
        "Subject": '01',
    },
    {
        "Code": "208",
        "Long": "English, Drama and Creative Studies",
        "Short": "Eng, Drama, Creative Studies",
        "Subject": '09',
    },  
    {
        "Code": "210",
        "Long": "Languages, Cultures, Art History and Music",
        "Short": "Lang, Cult, Art Hist and Music",
        "Subject": '09',
    },
    {
        "Code": "211",
        "Long": "Birmingham Business School",
        "Short": "Birmingham Business School",
        "Subject": '07',
    },
    {
        "Code": "212",
        "Long": "Government",
        "Short": "Government",
        "Subject": '08',
    },
    {
        "Code": "213",
        "Long": "Philosophy, Theology and Religion",
        "Short": "Phil, Theol & Religion",
        "Subject": '09',
    },
    {
        "Code": "214",
        "Long": "Birmingham International Academy",
        "Short": "Birmingham International Acad",
        "Subject": '09',
    },
    {
        "Code": "215",
        "Long": "Birmingham Medical School",
        "Short": "Birmingham Medical School",
        "Subject": '01',
    },
    {
        "Code": "216",
        "Long": "Institute of Applied Health Research",
        "Short": "Inst of Applied Health Res",
        "Subject": '02',
    },
    {
        "Code": "217",
        "Long": "Birmingham Clinical Trials Unit (BCTU)",
        "Short": "Bhm Clinical Trial Unit (BCTU)",
        "Subject": '02',
    },
    {
        "Code": "218",
        "Long": "Cancer Clinical Trials Unit (CCTU)",
        "Short": "Caner Clin Trials Unit (CCTU)",
        "Subject": '02',
    },
    {
        "Code": "219",
        "Long": "Nuclear Magnetic Resonance",
        "Short": "NMR",
        "Subject": '03',
    },
    {
        "Code": "222",
        "Long": "School of History and Cultures",
        "Short": "History and Cultures",
        "Subject": '09',
    },
    {
        "Code": "224",
        "Long": "Academic Services",
        "Short": "Academic Services",
        "Subject": '11',
    },
    {
        "Code": "225",
        "Long": "History",
        "Short": "History",
        "Subject": '09',
    },
    {
        "Code": "227",
        "Long": "Modern Languages",
        "Short": "Modern Languages",
        "Subject": '09',
    },
    {
        "Code": "228",
        "Long": "Teacher Education",
        "Short": "Teacher Education",
        "Subject": '11',
    },
    {
        "Code": "229",
        "Long": "Education and Social Justice",
        "Short": "Education & Social Justice",
        "Subject": '11',
    },
    {
        "Code": "231",
        "Long": "Disability, Inclusion and Special Needs",
        "Short": "Disab, Inclusion & Spec Needs",
        "Subject": '11',
    },
    {
        "Code": "233",
        "Long": "Graduate School",
        "Short": "Graduate School",
        "Subject": '11',
    },
    {
        "Code": "235",
        "Long": "Golf Studies",
        "Short": "Golf Studies",
        "Subject": '11',
    },
    {
        "Code": "236",
        "Long": "English Literature",
        "Short": "English Literature",
        "Subject": '09',
    },
    {
        "Code": "237",
        "Long": "English Language and Linguistics",
        "Short": "Eng Lang and Linguistics",
        "Subject": '09',
    },
    {
        "Code": "237",
        "Long": "Linguistics and Communication",
        "Short": "Linguistics and Communications",
        "Subject": '09',
    },
    {
        "Code": "238",
        "Long": "Liberal Arts",
        "Short": "Liberal Arts & Natural Science",
        "Subject": '08',
    },
    {
        "Code": "239",
        "Long": "Classics, Ancient History and Archaeology",
        "Short": "Classics, AH and Archaeology",
        "Subject": '09',
    },
    {
        "Code": "240",
        "Long": "Centre for Byzantine, Ottoman and Modern Greek Studies",
        "Short": "Byzantine, Ottoman, Greek Stud",
        "Subject": '09',
    },
    {
        "Code": "241",
        "Long": "Physiotherapy",
        "Short": "Physiotherapy",
        "Subject": '02',
    },
    {
        "Code": "242",
        "Long": "Dental Hygiene and Therapy",
        "Short": "Dental Hygiene and Therapy",
        "Subject": '02',
    },
    {
        "Code": "243",
        "Long": "Film and Creative Writing",
        "Short": "Film and Creative Writing",
        "Subject": '09',
    },
    {
        "Code": "244",
        "Long": "Institute of Forest Research",
        "Short": "Institute of Forest Research",
        "Subject": '03',
    },
    {
        "Code": "246",
        "Long": "Accounting",
        "Short": "Accounting",
        "Subject": '07',
    },
    {
        "Code": "247",
        "Long": "Finance",
        "Short": "Finance",
        "Subject": '07',
    },
    {
        "Code": "252",
        "Long": "Strategy and International Business",
        "Short": "Strategy and Int Business",
        "Subject": '07',
    },
    {
        "Code": "253",
        "Long": "International Summer School",
        "Short": "International Summer School",
        "Subject": '11',
    },
    {
        "Code": "254",
        "Long": "Educational Enterprise",
        "Short": "Educational Enterprise",
        "Subject": '07',
    },
    {
        "Code": "255",
        "Long": "Wiley",
        "Short": "Wiley",
        "Subject": '07',
    },
    {
        "Code": "256",
        "Long": "Institute of Clinical Sciences",
        "Short": "Institute of Clinical Sciences",
        "Subject": '02',
    },
    {
        "Code": "257",
        "Long": "Institute of Metabolism and Systems Research",
        "Short": "Inst of Metabolism and Sys Res",
        "Subject": '02',
    },
    {
        "Code": "258",
        "Long": "Institute of Inflammation and Ageing",
        "Short": "Inst of Inflammation / Ageing",
        "Subject": '02',
    },
    {
        "Code": "259",
        "Long": "Institute of Microbiology and Infection",
        "Short": "Inst of Microb and Infection",
        "Subject": '02',
    },
    {
        "Code": "259",
        "Long": "Microbes, Infection and Microbiomes",
        "Short": "Microbes, Infections, Microbms",
        "Subject": '02',
    },
    {
        "Code": "260",
        "Long": "School of Engineering",
        "Short": "Engineering",
        "Subject": '04',
    },
    {
        "Code": "261",
        "Long": "Management",
        "Short": "Management",
        "Subject": '07',
    },
    {
        "Code": "262",
        "Long": "Social Policy, Sociology and Criminology",
        "Short": "Soc Policy, Sociology & Crimin",
        "Subject": '08',
    },
    {
        "Code": "262",
        "Long": "Social Policy, Sociology and Criminology",
        "Short": "Soc Policy, Sociology & Criminology",
        "Subject": '08',
    },
    {
        "Code": "263",
        "Long": "Social Work and Social Care",
        "Short": "Social Work & Social Care",
        "Subject": '08',
    },
    {
        "Code": "264",
        "Long": "CAL Professional Services",
        "Short": "CAL Professional Services",
        "Subject": '09',
    },
    {
        "Code": "265",
        "Long": "University Music",
        "Short": "University Music",
        "Subject": '10',
    },
    {
        "Code": "266",
        "Long": "Institute of Translational Medicine",
        "Short": "Inst of Translational Medicine",
        "Subject": '02',
    },
    {
        "Code": "267",
        "Long": "Birmingham Health Partners",
        "Short": "Birmingham Health Partners",
        "Subject": '02',
    },
    {
        "Code": "268",
        "Long": "Advanced Therapies Facility",
        "Short": "Advanced Therapies Facility",
        "Subject": '02',
    },
    {
        "Code": "269",
        "Long": "Life Sciences Campus",
        "Short": "Life Sciences Campus",
        "Subject": '03',
    },
    {
        "Code": "270",
        "Long": "Clinical Immunology Service",
        "Short": "Clinical Immunology Service",
        "Subject": '03',
    },
    {
        "Code": "271",
        "Long": "High Temperature Research Centre",
        "Short": "High Temperature Research Cent",
        "Subject": '04',
    },
    {
        "Code": "272",
        "Long": "Higher Education Futures Institute",
        "Short": "HEFi",
        "Subject": '11',
    },
    {
        "Code": "273",
        "Long": "City_REDI",
        "Short": "City-REDI",
        "Subject": '07',
    },
    {
        "Code": "274",
        "Long": "Urdang Academy",
        "Short": "Urdang Academy",
        "Subject": '10',
    },
    {
        "Code": "275",
        "Long": "Birmingham Leadership Institute",
        "Short": "Birmingham Leadership Inst",
        "Subject": '08',
    }
]


module.exports = deptMapping;