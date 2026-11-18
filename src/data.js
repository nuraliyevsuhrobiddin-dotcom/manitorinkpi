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
          "Scopus Top 10% (Nature/Science)": {
              "score": 12,
              "description": "Scopus TOP-10% yoki yuqori impakt-faktorli xalqaro jurnaldagi maqola"
          },
          "Scopus Q1": {
              "score": 10,
              "description": "Scopus bazasidagi Q1 kvartil jurnallaridagi maqola"
          },
          "Scopus Q2": {
              "score": 8,
              "description": "Scopus bazasidagi Q2 kvartil jurnallaridagi maqola"
          },
          "Scopus Q3": {
              "score": 6,
              "description": "Scopus bazasidagi Q3 kvartil jurnallaridagi maqola"
          },
          "Scopus Q4": {
              "score": 4,
              "description": "Scopus bazasidagi Q4 kvartil jurnallaridagi maqola"
          },
          "Scopus / WoS boshqa": {
              "score": 1,
              "description": "Scopus yoki Web of Science bazasidagi indekslanuvchi boshqa maqola"
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
              "score": 2,
              "description": "Xalqaro miqyosdagi nufuzli konferensiya materiallaridagi maqola"
          },
          "Scopus iqtibos (Citation)": {
              "score": 1,
              "description": "Scopus bazasida affilatsiya bo'yicha aniqlangan iqtibos (har bir birlik)"
          },
          "Hirsh indeksi (h-index +1)": {
              "score": 2,
              "description": "Scopus bazasida qayd etilgan h-index ko'rsatkichining oshishi"
          }
      },
      "intellectual_property": {
          "Ixtiro / Seleksiya patenti": {
              "score": 10,
              "description": "Ixtiro, sanoat namunasi yoki yangi seleksiya yutug'i uchun olingan patent"
          },
          "Foydali model patenti": {
              "score": 5,
              "description": "Foydali model uchun olingan rasmiy patent"
          },
          "Scopus qayd etilgan patent": {
              "score": 5,
              "description": "Scopus ma'lumotlar bazasida affilatsiya bo'yicha indekslangan patent"
          },
          "Litsenziya shartnomasi": {
              "score": 4,
              "description": "Litsenziya shartnomasiga ega intellektual mulk obyekti"
          },
          "DGU (Dasturiy guvohnoma)": {
              "score": 2,
              "description": "EHM dasturi yoki ma'lumotlar bazasi uchun mualliflik guvohnomasi"
          }
      },
      "foreign_degree_and_title": {
          "TOP-100 OTM ilmiy darajasi": {
              "score": 10,
              "description": "TOP-100 xorijiy OTMdan olingan PhD yoki DSc ilmiy darajasi"
          },
          "TOP-300 OTM ilmiy darajasi": {
              "score": 6,
              "description": "TOP-300 xorijiy OTMdan olingan PhD yoki DSc ilmiy darajasi"
          },
          "TOP-500 OTM ilmiy darajasi": {
              "score": 4,
              "description": "TOP-500 xorijiy OTMdan olingan PhD yoki DSc ilmiy darajasi"
          },
          "TOP-1000 OTM ilmiy darajasi": {
              "score": 2,
              "description": "TOP-1000 xorijiy OTMdan olingan PhD yoki DSc ilmiy darajasi"
          },
          "TOP-300 OTM magistratura diplomi": {
              "score": 1,
              "description": "TOP-300 xorijiy OTMdan olingan magistratura diplomi"
          }
      },
      "methodological_work": {
          "Darslik": {
              "score": 8,
              "description": "Vazirlik grifi bilan nashr etilgan darslik"
          },
          "Monografiya": {
              "score": 6,
              "description": "Ilmiy kengash qarori bilan chop etilgan monografiya"
          },
          "O'quv qo'llanma": {
              "score": 4,
              "description": "Nashr etilgan o'quv qo'llanma"
          }
      },
      "project": {
          "Xorijiy / Xalqaro grant": {
              "score": 20,
              "description": "Xorijiy va xalqaro tashkilotlardan jalb qilingan ilmiy loyiha"
          },
          "Davlat ilmiy dasturi loyihasi": {
              "score": 15,
              "description": "Ilmiy faoliyatga oid davlat dasturlari doirasidagi amaliy/innovatsion loyiha"
          },
          "Xo'jalik shartnomasi": {
              "score": 10,
              "description": "Xo'jalik yurituvchi subyektlar buyurtmalari asosidagi tadqiqot shartnomasi"
          },
          "Xalqaro grant arizasi": {
              "score": 5,
              "description": "Xalqaro tanlovlarga topshirilgan ilmiy loyiha arizasi"
          },
          "Davlat granti arizasi": {
              "score": 3,
              "description": "Davlat ilmiy dasturlariga topshirilgan loyiha arizasi"
          }
      },
      "international_activity": {
          "Xorijiy professor (rivojlangan davlat)": {
              "score": 8,
              "description": "Rivojlangan davlatdan yuqori malakali xorijiy professor-o'qituvchini jalb qilish"
          },
          "Xorijiy professor (TOP-500 OTM)": {
              "score": 5,
              "description": "TOP-500 xorijiy OTMdan ilmiy darajali mutaxassisni jalb qilish"
          },
          "Xalqaro akademik mobillik / stajirovka": {
              "score": 6,
              "description": "Xorijiy OTMda o'tilgan malaka oshirish, ilmiy stajirovka yoki dars berish"
          },
          "Qo'shma ta'lim dasturi (Double Degree)": {
              "score": 4,
              "description": "Xorijiy OTM bilan qo'shma ta'lim dasturi doirasida faoliyat yuritish"
          }
      },
      "student_achievement": {
          "Xalqaro tanlov / olimpiada 1-o'rin": {
              "score": 6,
              "description": "Shogird talabaning xalqaro tanlov yoki olimpiadadagi 1-o'rin g'olibligi"
          },
          "Xalqaro tanlov / olimpiada 2-o'rin": {
              "score": 5,
              "description": "Shogird talabaning xalqaro tanlov yoki olimpiadadagi 2-o'rin g'olibligi"
          },
          "Xalqaro tanlov / olimpiada 3-o'rin": {
              "score": 4,
              "description": "Shogird talabaning xalqaro tanlov yoki olimpiadadagi 3-o'rin g'olibligi"
          },
          "Prezident / Davlat stipendiyasi": {
              "score": 5,
              "description": "Shogird talabaning Prezident yoki nomdor davlat stipendiyasiga sazovor bo'lishi"
          },
          "Respublika tanlovi 1-o'rin": {
              "score": 3,
              "description": "Shogird talabaning respublika fan olimpiadasi yoki tanlovidagi 1-o'rin g'olibligi"
          },
          "Respublika tanlovi 2-o'rin": {
              "score": 2,
              "description": "Shogird talabaning respublika tanlovidagi 2-o'rin g'olibligi"
          },
          "Respublika tanlovi 3-o'rin": {
              "score": 1,
              "description": "Shogird talabaning respublika tanlovidagi 3-o'rin g'olibligi"
          }
      },
      "supervision": {
          "DSc himoyasi (shaxsiy yoki shogird)": {
              "score": 15,
              "description": "DSc doktorlik dissertatsiyasi himoyasi yoki shogirdning DSc himoyasi"
          },
          "PhD himoyasi (shaxsiy yoki shogird)": {
              "score": 10,
              "description": "PhD doktorlik dissertatsiyasi himoyasi yoki shogirdning PhD himoyasi"
          },
          "Ilmiy kengash a'zoligi": {
              "score": 5,
              "description": "Ixtisoslashgan ilmiy kengash raisi, o'rinbosari yoki a'zosi faoliyati"
          },
          "Ilmiy seminar a'zoligi": {
              "score": 3,
              "description": "Ixtisoslashgan ilmiy kengash qoshidagi ilmiy seminar a'zoligi"
          }
      },
      "thesis_defense": {
          "PhD": {
              "score": 1,
              "description": "PhD (falsafa doktori) ilmiy darajasini olish"
          },
          "DSc": {
              "score": 2,
              "description": "DSc (fan doktori) ilmiy darajasini olish"
          },
          "dotsentlik": {
              "score": 1,
              "description": "Dotsent ilmiy unvonini olish"
          },
          "professorlik": {
              "score": 2,
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
