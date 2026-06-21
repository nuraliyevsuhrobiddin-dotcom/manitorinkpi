export const CONSTANTS = {
  "FACULTIES": [
    {
      "id": 1,
      "name": "Pedagogika"
    },
    {
      "id": 2,
      "name": "Filologiya"
    },
    {
      "id": 3,
      "name": "Ijtimoiy fanlar"
    }
  ],
  "DEPARTMENTS": [
    {
      "id": 1,
      "name": "Pedagogika",
      "facultyId": 1
    },
    {
      "id": 2,
      "name": "Tabiiy fanlar",
      "facultyId": 1
    },
    {
      "id": 3,
      "name": "Boshlang‘ich ta’lim metodikasi",
      "facultyId": 1
    },
    {
      "id": 4,
      "name": "Boshlang‘ich ta’lim nazariyasi",
      "facultyId": 1
    },
    {
      "id": 5,
      "name": "Maktabgacha ta’lim",
      "facultyId": 1
    },
    {
      "id": 6,
      "name": "Matematika va ta’limda axborot texnologiyalari",
      "facultyId": 1
    },
    {
      "id": 7,
      "name": "Til va adabiyot",
      "facultyId": 2
    },
    {
      "id": 8,
      "name": "Xorijiy til nazariyasi va amaliyoti",
      "facultyId": 2
    },
    {
      "id": 9,
      "name": "Ijtimoiy fanlar",
      "facultyId": 3
    },
    {
      "id": 10,
      "name": "Tarix",
      "facultyId": 3
    },
    {
      "id": 11,
      "name": "Geografiya",
      "facultyId": 3
    },
    {
      "id": 12,
      "name": "San’atshunoslik",
      "facultyId": 3
    },
    {
      "id": 13,
      "name": "Jismoniy madaniyat",
      "facultyId": 3
    }
  ],
  "DIVISIONS": [],
  "POSITIONS": [
    "Stajor o‘qituvchi",
    "Assistent",
    "O‘qituvchi",
    "Katta o‘qituvchi",
    "Dotsent",
    "Professor",
    "Kafedra mudiri"
  ],
  "EMPLOYMENT_TYPES": [
    "Asosiy",
    "Ichki o‘rindosh",
    "Tashqi o‘rindosh"
  ],
  "PROJECT_TYPES": [
    "Loyiha",
    "Startap",
    "Grant",
    "Spinoff"
  ],
  "PROJECT_DIRECTIONS": [
    "Innovatsion",
    "Amaliy",
    "Fundamental"
  ],
  "PROJECT_LEADER_POSITIONS": [
    "Professor-o‘qituvchi",
    "Ilmiy xodim",
    "Talaba"
  ],
  "PROJECT_DURATIONS": [
    1,
    2,
    3,
    4
  ],
  "PROJECTS": [],
  "PROFESSORS": [],
  "PLANS": [],
  "ACHIEVEMENTS": [],
  "SCORING_SYSTEM": {
    "publication": {
      "Scopus Q1": {
        "score": 15,
        "description": "Scopus bazasidagi Q1 jurnallaridagi maqola"
      },
      "Scopus Q2": {
        "score": 12,
        "description": "Scopus bazasidagi Q2 jurnallaridagi maqola"
      },
      "Scopus Q3": {
        "score": 10,
        "description": "Scopus bazasidagi Q3 jurnallaridagi maqola"
      },
      "Scopus Q4": {
        "score": 8,
        "description": "Scopus bazasidagi Q4 jurnallaridagi maqola"
      },
      "OAK respublika": {
        "score": 3,
        "description": "OAK ro'yxatidagi respublika jurnallaridagi maqola"
      },
      "OAK xalqaro": {
        "score": 3,
        "description": "OAK ro'yxatidagi xalqaro jurnallardagi maqola"
      },
      "Xalqaro konferensiya": {
        "score": 6,
        "description": "Xalqaro miqyosdagi konferensiya materiallaridagi maqola"
      }
    },
    "intellectual_property": {
      "Patent": {
        "score": 10,
        "description": "Ixtiro uchun olingan patent"
      },
      "DGU": {
        "score": 2,
        "description": "Dasturiy mahsulot uchun guvohnoma"
      }
    },
    "methodological_work": {
      "Darslik": {
        "score": 8,
        "description": "Nashr etilgan darslik"
      },
      "Monografiya": {
        "score": 6,
        "description": "Nashr etilgan monografiya"
      },
      "O‘quv qo‘llanma": {
        "score": 4,
        "description": "Nashr etilgan o'quv qo'llanma"
      }
    },
    "project": {
      "Bajarilayotgan xalqaro loyiha": {
        "score": 20,
        "description": "Rahbarlik qilinayotgan xalqaro ilmiy loyiha"
      },
      "Bajarilayotgan davlat loyihasi": {
        "score": 15,
        "description": "Rahbarlik qilinayotgan davlat ilmiy loyihasi"
      },
      "Xalqaro grant arizasi": {
        "score": 5,
        "description": "Topshirilgan xalqaro grant arizasi"
      },
      "Davlat granti arizasi": {
        "score": 5,
        "description": "Topshirilgan davlat granti arizasi"
      }
    },
    "international_activity": {
      "Xorijiy stajirovka": {
        "score": 10,
        "description": "Xorijiy mamlakatlarda o'tilgan malaka oshirish yoki stajirovka"
      },
      "Xorijiy professor jalb qilish": {
        "score": 5,
        "description": "O'quv jarayoniga xorijiy professor yoki mutaxassisni jalb qilish"
      }
    },
    "student_achievement": {
      "Xalqaro tanlov 1-o‘rin": {
        "score": 6,
        "description": "Talabaning xalqaro tanlovdagi 1-o'rin g'olibligi"
      },
      "Xalqaro tanlov 2-o‘rin": {
        "score": 5,
        "description": "Talabaning xalqaro tanlovdagi 2-o'rin g'olibligi"
      },
      "Xalqaro tanlov 3-o‘rin": {
        "score": 4,
        "description": "Talabaning xalqaro tanlovdagi 3-o'rin g'olibligi"
      },
      "Respublika tanlovi 1-o‘rin": {
        "score": 3,
        "description": "Talabaning respublika tanlovidagi 1-o'rin g'olibligi"
      },
      "Respublika tanlovi 2-o‘rin": {
        "score": 2,
        "description": "Talabaning respublika tanlovidagi 2-o'rin g'olibligi"
      },
      "Respublika tanlovi 3-o‘rin": {
        "score": 1,
        "description": "Talabaning respublika tanlovidagi 3-o'rin g'olibligi"
      }
    },
    "supervision": {
      "DSc rahbarlik": {
        "score": 15,
        "description": "DSc dissertatsiyasiga ilmiy rahbarlik"
      },
      "PhD rahbarlik": {
        "score": 10,
        "description": "PhD dissertatsiyasiga ilmiy rahbarlik"
      },
      "Kengash a’zoligi": {
        "score": 10,
        "description": "Ilmiy kengash a'zoligi"
      },
      "Seminar a’zoligi": {
        "score": 5,
        "description": "Ilmiy seminar a'zoligi"
      }
    },
    "thesis_defense": {
      "PhD": {
        "score": 1,
        "description": "PhD ilmiy darajasini olish"
      },
      "DSc": {
        "score": 1,
        "description": "DSc ilmiy darajasini olish"
      },
      "dotsentlik": {
        "score": 1,
        "description": "Dotsent ilmiy unvonini olish"
      },
      "professorlik": {
        "score": 1,
        "description": "Professor ilmiy unvonini olish"
      }
    }
  },
  "USERS": [
    {
      "id": 3,
      "username": "guest",
      "role": "guest"
    }
  ],
  "THESIS_DEFENSES": [],
  "SPECIALTIES": [
    "13.00.01 - Pedagogika nazariyasi. Pedagogik ta'limotlar tarixi",
    "10.00.02 - O'zbek adabiyoti",
    "07.00.01 - O'zbekiston tarixi"
  ],
  "FIELDS_OF_SCIENCE": [
    "Pedagogika fanlari",
    "Filologiya fanlari",
    "Tarix fanlari",
    "Fizika-matematika fanlari",
    "Iqtisodiyot fanlari"
  ],
  "DEFENSE_TYPES": [
    "PhD",
    "DSc",
    "dotsent",
    "professor"
  ]
};
