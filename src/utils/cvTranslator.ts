import { CVDocument, CVSectionTitles } from '../types/cv';

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const TRANSLATION_MAP: Record<string, {
  sectionTitles: CVSectionTitles;
  jobTitles: Record<string, string>;
  commonWords: Record<string, string>;
  profileBio: string;
  experiences: Array<{
    role: string;
    company: string;
    period: string;
    description: string;
    bullets: string[];
  }>;
  educations: Array<{
    school: string;
    degree: string;
    honors: string;
  }>;
  projects: Array<{
    name: string;
    role: string;
    description: string;
  }>;
  languages: Array<{
    name: string;
    level: string;
  }>;
}> = {
  vi: {
    sectionTitles: {
      contact: 'THÔNG TIN LIÊN HỆ',
      profile: 'GIỚI THIỆU BẢN THÂN',
      experience: 'KINH NGHIỆM LÀM VIỆC',
      education: 'HỌC VẤN & BẰNG CẤP',
      skills: 'KỸ NĂNG CHUYÊN MÔN',
      tools: 'CÔNG CỤ & CÔNG NGHỆ',
      projects: 'DỰ ÁN TIÊU BIỂU',
      languages: 'NGOẠI NGỮ',
      certifications: 'CHỨNG CHỈ NGHỀ NGHIỆP',
    },
    jobTitles: {
      'Senior Product Designer': 'Chuyên viên Thiết kế Sản phẩm Cấp cao',
      'Lead UI/UX Designer': 'Trưởng nhóm Thiết kế UI/UX',
      'Senior Frontend Developer': 'Kỹ sư Lập trình Frontend Cấp cao',
      'Fullstack Developer': 'Lập trình viên Fullstack',
      'Product Manager': 'Quản lý Sản phẩm',
    },
    commonWords: {
      'Present': 'Hiện tại',
      'Skills': 'Kỹ năng',
      'Tools': 'Công cụ',
      'Experience': 'Kinh nghiệm',
      'Education': 'Học vấn',
      'Contact': 'Liên hệ',
      'Languages': 'Ngoại ngữ',
      'Summary': 'Tóm tắt',
      'Native': 'Bản ngữ',
      'Fluent': 'Thành thạo',
      'Professional': 'Chuyên nghiệp',
      'Intermediate': 'Trung cấp',
      'Elementary': 'Cơ bản',
    },
    profileBio: 'Chuyên gia thiết kế sản phẩm số & UI/UX với hơn 6 năm kinh nghiệm kiến tạo trải nghiệm người dùng tinh tế, tối ưu hóa tỷ lệ chuyển đổi và xây dựng Design System quy mô lớn cho các sản phẩm Fintech, E-commerce và SaaS. Sở hữu tư duy giải quyết vấn đề sáng tạo kết hợp hiểu biết sâu sắc về hành vi người dùng.',
    experiences: [
      {
        role: 'Lead Product Designer',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - HIỆN TẠI',
        description: 'Chỉ đạo định hướng thiết kế hệ sinh thái thanh toán điện tử & ngân hàng số với hơn 5.000.000 người dùng hàng tháng.',
        bullets: [
          'Tái cấu trúc luồng thanh toán QR & chuyển tiền nhanh, giảm 28% tỷ lệ hủy giao dịch (Drop-off rate).',
          'Xây dựng và phát triển Design System toàn diện với 400+ reusable components trên Figma & Storybook.',
          'Dẫn dắt và cố vấn cho đội ngũ 8 nhà thiết kế UI/UX, thúc đẩy phương pháp tiếp cận Human-Centered Design.'
        ]
      },
      {
        role: 'Senior UI/UX Specialist',
        company: 'Grab Financial Group',
        period: '2021 - 2023',
        description: 'Phụ trách thiết kế trải nghiệm tính năng vi mô, ví điện tử & chương trình khách hàng thân thiết.',
        bullets: [
          'Thực hiện nghiên cứu người dùng định lượng và định tính với hơn 120 buổi phỏng vấn chuyên sâu.',
          'Tối ưu hóa hành trình đăng ký hội viên mới, gia tăng 35% lượng kích hoạt ví thành công trong tháng đầu.'
        ]
      },
      {
        role: 'UI Designer & Prototyper',
        company: 'VNG Corporation - ZaloPay Ecosystem',
        period: '2019 - 2021',
        description: 'Thiết kế giao diện ứng dụng di động iOS/Android và web portals quản trị cho đối tác bán buôn.',
        bullets: [
          'Thiết kế hơn 50+ micro-interactions và hiệu ứng động mượt mà bằng After Effects & Lottie.',
          'Hợp tác chặt chẽ với đội ngũ kỹ sư Frontend đảm bảo độ chuẩn xác pixel-perfect khi bàn giao thiết kế.'
        ]
      }
    ],
    educations: [
      {
        school: 'Đại Học Kiến Trúc TP. Hồ Chí Minh',
        degree: 'Cử nhân Thiết kế Đồ họa & Tương tác số',
        honors: 'Tốt nghiệp loại Giỏi - GPA 3.8/4.0'
      },
      {
        school: 'Interaction Design Foundation (IxDF)',
        degree: 'Chứng chỉ Chuyên sâu UX Master & Design Thinking',
        honors: 'Top 5% học viên xuất sắc toàn khóa'
      }
    ],
    projects: [
      {
        name: 'FinFlow - Siêu ứng dụng Tài chính Cá nhân',
        role: 'Product Designer & UX Researcher',
        description: 'Nền tảng quản lý tài chính thông minh tích hợp AI phân tích chi tiêu tự động, đạt 4.8 sao trên App Store.'
      },
      {
        name: 'Nexus UI Design System',
        role: 'Lead Architect',
        description: 'Hệ thống thiết kế mã nguồn mở tối ưu cho web đa nền tảng, hỗ trợ Dark Mode và khả năng truy cập WCAG AA.'
      }
    ],
    languages: [
      { name: 'Tiếng Việt', level: 'Tiếng mẹ đẻ (Bản ngữ)' },
      { name: 'Tiếng Anh', level: 'Thành thạo - IELTS 7.5' },
      { name: 'Tiếng Nhật', level: 'Giao tiếp cơ bản (JLPT N4)' }
    ]
  },
  en: {
    sectionTitles: {
      contact: 'CONTACT INFORMATION',
      profile: 'ABOUT ME / PROFILE',
      experience: 'WORK EXPERIENCE',
      education: 'EDUCATION & DEGREES',
      skills: 'CORE COMPETENCIES',
      tools: 'TOOLS & TECHNOLOGIES',
      projects: 'FEATURED PROJECTS',
      languages: 'LANGUAGES',
      certifications: 'CERTIFICATIONS',
    },
    jobTitles: {
      'Senior Product Designer': 'Senior Product Designer',
      'Lead UI/UX Designer': 'Lead UI/UX Designer',
      'Senior Frontend Developer': 'Senior Frontend Developer',
      'Fullstack Developer': 'Fullstack Developer',
      'Product Manager': 'Product Manager',
    },
    commonWords: {
      'Present': 'Present',
      'Skills': 'Skills',
      'Tools': 'Tools',
      'Experience': 'Experience',
      'Education': 'Education',
      'Contact': 'Contact',
      'Languages': 'Languages',
      'Summary': 'Summary',
      'Native': 'Native',
      'Fluent': 'Fluent',
      'Professional': 'Professional',
      'Intermediate': 'Intermediate',
      'Elementary': 'Elementary',
    },
    profileBio: 'Strategic Product & UI/UX Designer with over 6 years of expertise in architecting human-centric digital experiences, driving product conversion rates, and engineering scalable Design Systems for high-growth Fintech and SaaS enterprises. Passionate about translating complex user workflows into intuitive interfaces.',
    experiences: [
      {
        role: 'Lead Product Designer',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - PRESENT',
        description: 'Directing product design strategy for digital banking and payment ecosystems serving 5M+ monthly active users.',
        bullets: [
          'Redesigned digital QR payment flows, achieving a 28% decrease in transaction checkout drop-offs.',
          'Engineered an enterprise-grade Design System with 400+ components synced between Figma and React Storybook.',
          'Mentored and coached an 8-member product design squad, championing data-informed Design Thinking.'
        ]
      },
      {
        role: 'Senior UI/UX Specialist',
        company: 'Grab Financial Group',
        period: '2021 - 2023',
        description: 'Owned the end-to-end design lifecycle for micro-investing, e-wallets, and consumer loyalty programs.',
        bullets: [
          'Conducted mixed-methods research across 120+ deep-dive usability tests and customer journey mapping sessions.',
          'Optimized onboarding funnel, driving a 35% increase in first-month wallet activation rate.'
        ]
      },
      {
        role: 'UI Designer & Prototyper',
        company: 'VNG Corporation - ZaloPay Ecosystem',
        period: '2019 - 2021',
        description: 'Designed mobile apps for iOS/Android and merchant portal web applications.',
        bullets: [
          'Crafted 50+ interactive prototypes and seamless micro-animations utilizing After Effects and Lottie.',
          'Partnered closely with engineering squads to ensure pixel-perfect fidelity across varied screen dimensions.'
        ]
      }
    ],
    educations: [
      {
        school: 'University of Architecture Ho Chi Minh City',
        degree: 'Bachelor of Graphic Design & Digital Interaction',
        honors: 'Graduated with Distinction - GPA 3.8/4.0'
      },
      {
        school: 'Interaction Design Foundation (IxDF)',
        degree: 'Certified UX Master & Human-Centered Design',
        honors: 'Top 5% Cohort Performer'
      }
    ],
    projects: [
      {
        name: 'FinFlow - Intelligent Wealth Management',
        role: 'Product Designer & UX Researcher',
        description: 'Next-gen personal finance app powered by AI expenditure diagnostics, rated 4.8 stars on the App Store.'
      },
      {
        name: 'Nexus UI Design System',
        role: 'Lead System Architect',
        description: 'Open-source design system supporting cross-platform web ecosystems with Dark Mode and WCAG AA compliance.'
      }
    ],
    languages: [
      { name: 'Vietnamese', level: 'Native proficiency' },
      { name: 'English', level: 'Fluent - Professional (IELTS 7.5)' },
      { name: 'Japanese', level: 'Basic conversational (JLPT N4)' }
    ]
  },
  ja: {
    sectionTitles: {
      contact: '連絡先情報',
      profile: '自己紹介 / プロフィール',
      experience: '職務経歴 / 実務経験',
      education: '学歴 & 資格',
      skills: '専門スキル',
      tools: '使用ツール & 技術',
      projects: '主なプロジェクト実績',
      languages: '語学力',
      certifications: '認定資格',
    },
    jobTitles: {
      'Senior Product Designer': 'シニアプロダクトデザイナー',
      'Lead UI/UX Designer': 'リードUI/UXデザイナー',
      'Senior Frontend Developer': 'シニアフロントエンドエンジニア',
      'Fullstack Developer': 'フルスタックエンジニア',
      'Product Manager': 'プロダクトマネージャー',
    },
    commonWords: {
      'Present': '現在',
      'Skills': 'スキル',
      'Tools': 'ツール',
      'Experience': '経験',
      'Education': '学歴',
      'Contact': '連絡先',
      'Languages': '言語',
      'Summary': '概要',
      'Native': '母国語',
      'Fluent': '流暢',
      'Professional': 'ビジネスレベル',
      'Intermediate': '日常会話レベル',
      'Elementary': '初級',
    },
    profileBio: '6年以上の実務経験を持つプロダクトおよびUI/UXデザイナー。Fintech、EC、SaaS分野で使いやすさと美しさを両立させたユーザー体験の創出、コンバージョン率の向上、デザインシステムの構築に強みを持っています。',
    experiences: [
      {
        role: 'リードプロダクトデザイナー',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023年 - 現在',
        description: '月間500万人以上が利用する電子決済およびデジタルバンキングのエコシステムのUI/UXデザインを統括。',
        bullets: [
          'QR決済フローを刷新し、決済途中離脱率を28%削減。',
          '400以上のコンポーネントからなる企業向けデザインシステムをFigmaおよびStorybook上で構築。',
          '8名のデザイナーチームをリードし、ユーザー中心の設計手法を徹底。'
        ]
      },
      {
        role: 'シニアUI/UXスペシャリスト',
        company: 'Grab Financial Group',
        period: '2021年 - 2023年',
        description: '電子ウォレットおよびロイヤルティプログラムのUI/UX設計全般を担当。',
        bullets: [
          '120回以上のユーザーインタビューおよびユーザビリティテストを実施。',
          '新規オンボーディング体験を最適化し、初月アクティブ率を35%向上。'
        ]
      }
    ],
    educations: [
      {
        school: 'ホーチミン市建築大学',
        degree: 'グラフィックデザイン & インタラクション学科 学士',
        honors: '優秀卒業生 - GPA 3.8/4.0'
      }
    ],
    projects: [
      {
        name: 'FinFlow - AI資産管理アプリ',
        role: 'プロダクトデザイナー',
        description: 'AI自動支出分析を搭載したパーソナルファイナンスアプリ。'
      }
    ],
    languages: [
      { name: 'ベトナム語', level: '母国語' },
      { name: '英語', level: 'ビジネスレベル (IELTS 7.5)' },
      { name: '日本語', level: '日常会話レベル (JLPT N4)' }
    ]
  },
  ko: {
    sectionTitles: {
      contact: '연락처 정보',
      profile: '자기소개 및 요약',
      experience: '경력 사항',
      education: '학력 및 자격',
      skills: '전문 기술 역량',
      tools: '사용 툴 & 테크놀로지',
      projects: '주요 프로젝트',
      languages: '외국어 능력',
      certifications: '자격증',
    },
    jobTitles: {
      'Senior Product Designer': '시니어 프로덕트 디자이너',
      'Lead UI/UX Designer': '리드 UI/UX 디자이너',
      'Senior Frontend Developer': '시니어 프론트엔드 개발자',
      'Fullstack Developer': '풀스택 개발자',
      'Product Manager': '프로덕트 매니저',
    },
    commonWords: {
      'Present': '현재',
      'Skills': '기술',
      'Tools': '도구',
      'Experience': '경력',
      'Education': '학력',
      'Contact': '연락처',
      'Languages': '외국어',
      'Summary': '요약',
      'Native': '원어민',
      'Fluent': '능숙함',
      'Professional': '비즈니스 회화',
      'Intermediate': '중급',
      'Elementary': '기초',
    },
    profileBio: '6년 이상의 경력을 보유한 시니어 프로덕트 및 UI/UX 디자이너입니다. 핀테크, 이커머스 및 SaaS 플랫폼에서 전환율을 극대화하고 대규모 디자인 시스템을 성공적으로 구축한 경험을 보유하고 있습니다.',
    experiences: [
      {
        role: '리드 프로덕트 디자이너',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - 현재',
        description: '월간 500만 명 이상이 이용하는 전자 결제 및 디지털 뱅킹 시스템 디자인 총괄.',
        bullets: [
          'QR 결제 플로우를 재설계하여 결제 이탈률 28% 감소 달성.',
          'Figma 및 React Storybook 기반 400개 이상의 재사용 컴포넌트 디자인 시스템 구축.',
          '8명의 디자이너 팀을 이끌며 사용자 중심 디자인(UCD) 문화 정착.'
        ]
      }
    ],
    educations: [
      {
        school: '호치민 건축대학교',
        degree: '시각 디자인 & 디지털 인터랙션 학사',
        honors: '최우수 졸업 - GPA 3.8/4.0'
      }
    ],
    projects: [
      {
        name: 'FinFlow - 스마트 금융 슈퍼앱',
        role: '프로덕트 디자이너',
        description: 'AI 지출 분석이 탑재된 개인 금융 관리 애플리케이션.'
      }
    ],
    languages: [
      { name: '베트남어', level: '모국어' },
      { name: '영어', level: '비즈니스 능숙 (IELTS 7.5)' },
      { name: '한국어', level: '기초 회화' }
    ]
  },
  zh: {
    sectionTitles: {
      contact: '联系方式',
      profile: '个人简介',
      experience: '工作经历',
      education: '教育背景',
      skills: '专业技能',
      tools: '工具与技术栈',
      projects: '精选项目经验',
      languages: '语言能力',
      certifications: '资质证书',
    },
    jobTitles: {
      'Senior Product Designer': '资深产品设计师',
      'Lead UI/UX Designer': 'UI/UX设计主管',
      'Senior Frontend Developer': '资深前端工程师',
      'Fullstack Developer': '全栈工程师',
      'Product Manager': '产品经理',
    },
    commonWords: {
      'Present': '至今',
      'Skills': '技能',
      'Tools': '工具',
      'Experience': '经验',
      'Education': '教育',
      'Contact': '联系',
      'Languages': '语言',
      'Summary': '概述',
      'Native': '母语',
      'Fluent': '精通',
      'Professional': '工作熟练',
      'Intermediate': '中等水平',
      'Elementary': '基础入门',
    },
    profileBio: '拥有6年以上经验的资深产品及UI/UX设计师，深耕金融科技（Fintech）、电商及SaaS领域。精通用户体验全链路设计、转化率优化及企业级Design System搭建。',
    experiences: [
      {
        role: '设计主管 / Lead Product Designer',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - 至今',
        description: '主导服务超过500万月活跃用户的移动支付与数字银行产品设计。',
        bullets: [
          '重构扫码支付业务流，大幅降低28%的支付流失率。',
          '建立涵盖400+可复用组件的企业级设计系统，统一多端视觉规范。',
          '指导8人设计团队，全面推行以用户为中心的设计流程。'
        ]
      }
    ],
    educations: [
      {
        school: '胡志明市建筑大学',
        degree: '平面设计与数字媒体互动学士',
        honors: '荣誉毕业生 - GPA 3.8/4.0'
      }
    ],
    projects: [
      {
        name: 'FinFlow 智能个人财务平台',
        role: '核心产品设计师',
        description: '集成AI智能消费诊断的个人财务超级App，App Store评分4.8分。'
      }
    ],
    languages: [
      { name: '越南语', level: '母语' },
      { name: '英语', level: '商务流利 (IELTS 7.5)' },
      { name: '中文', level: '日常商务沟通' }
    ]
  },
  fr: {
    sectionTitles: {
      contact: 'COORDONNÉES',
      profile: 'PROFIL PROFESSIONNEL',
      experience: 'EXPÉRIENCE PROFESSIONNELLE',
      education: 'FORMATION & DIPLÔMES',
      skills: 'COMPÉTENCES CLÉS',
      tools: 'OUTILS & TECHNOLOGIES',
      projects: 'PROJETS MAJEURS',
      languages: 'LANGUES',
      certifications: 'CERTIFICATIONS',
    },
    jobTitles: {
      'Senior Product Designer': 'Designer Produit Senior',
      'Lead UI/UX Designer': 'Lead Designer UI/UX',
      'Senior Frontend Developer': 'Développeur Frontend Senior',
      'Fullstack Developer': 'Développeur Fullstack',
      'Product Manager': 'Chef de Produit',
    },
    commonWords: {
      'Present': 'Présent',
      'Skills': 'Compétences',
      'Tools': 'Outils',
      'Experience': 'Expérience',
      'Education': 'Formation',
      'Contact': 'Contact',
      'Languages': 'Langues',
      'Summary': 'Résumé',
      'Native': 'Langue maternelle',
      'Fluent': 'Courant',
      'Professional': 'Professionnel',
      'Intermediate': 'Intermédiaire',
      'Elementary': 'Élémentaire',
    },
    profileBio: 'Designer Produit & UI/UX avec plus de 6 ans d\'expérience dans la conception d\'expériences numériques centrées sur l\'utilisateur, l\'optimisation des taux de conversion et l\'élaboration de Design Systems évolutifs pour la Fintech et le SaaS.',
    experiences: [
      {
        role: 'Lead Product Designer',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - PRÉSENT',
        description: 'Direction de la stratégie de conception pour un écosystème de paiement numérique comptant plus de 5 millions d\'utilisateurs mensuels.',
        bullets: [
          'Refonte du parcours de paiement QR, réduisant le taux d\'abandon de 28%.',
          'Création d\'un Design System d\'entreprise avec plus de 400 composants réutilisables.',
          'Encadrement d\'une équipe de 8 designers produit.'
        ]
      }
    ],
    educations: [
      {
        school: 'Université d\'Architecture de Hô Chi Minh-Ville',
        degree: 'Licence en Design Graphique & Interaction Numérique',
        honors: 'Mention Très Bien - GPA 3.8/4.0'
      }
    ],
    projects: [
      {
        name: 'FinFlow - Gestion Financière Intelligente',
        role: 'Designer Produit & Chercheur UX',
        description: 'Application financière de nouvelle génération dotée d\'une analyse des dépenses par IA.'
      }
    ],
    languages: [
      { name: 'Vietnamien', level: 'Langue maternelle' },
      { name: 'Anglais', level: 'Courant - Professionnel (IELTS 7.5)' },
      { name: 'Français', level: 'Niveau intermédiaire' }
    ]
  },
  de: {
    sectionTitles: {
      contact: 'KONTAKTINFORMATIONEN',
      profile: 'ÜBER MICH / PROFIL',
      experience: 'BERUFSERFAHRUNG',
      education: 'AUSBILDUNG & STUDIUM',
      skills: 'FACHKENNTNISSE',
      tools: 'WERKZEUGE & TECHNOLOGIEN',
      projects: 'AUSGEWÄHLTE PROJEKTE',
      languages: 'SPRACHKENNTNISSE',
      certifications: 'ZERTIFIKATE',
    },
    jobTitles: {
      'Senior Product Designer': 'Senior Produktdesigner',
      'Lead UI/UX Designer': 'Lead UI/UX Designer',
      'Senior Frontend Developer': 'Senior Frontend Entwickler',
      'Fullstack Developer': 'Fullstack Entwickler',
      'Product Manager': 'Produktmanager',
    },
    commonWords: {
      'Present': 'Heute',
      'Skills': 'Fähigkeiten',
      'Tools': 'Werkzeuge',
      'Experience': 'Erfahrung',
      'Education': 'Ausbildung',
      'Contact': 'Kontakt',
      'Languages': 'Sprachen',
      'Summary': 'Zusammenfassung',
      'Native': 'Muttersprache',
      'Fluent': 'Verhandlungssicher',
      'Professional': 'Fließend',
      'Intermediate': 'Gute Kenntnisse',
      'Elementary': 'Grundkenntnisse',
    },
    profileBio: 'Strategischer Produkt- und UI/UX-Designer mit mehr als 6 Jahren Erfahrung in der Gestaltung nutzerzentrierter digitaler Erlebnisse, der Optimierung von Konversionsraten und dem Aufbau skalierbarer Design-Systeme für Fintech- und SaaS-Unternehmen.',
    experiences: [
      {
        role: 'Lead Product Designer',
        company: 'VNPAY Fintech Solution Corp',
        period: '2023 - HEUTE',
        description: 'Leitung der Designstrategie für ein digitales Zahlungsökosystem mit über 5 Millionen monatlich aktiven Nutzern.',
        bullets: [
          'Neugestaltung des QR-Zahlungsablaufs mit 28% weniger Abbruchrate.',
          'Aufbau eines unternehmensweiten Design-Systems mit über 400 Komponenten.',
          'Führung und Mentoring eines Teams von 8 Produktdesignern.'
        ]
      }
    ],
    educations: [
      {
        school: 'Architekturuniversität Ho-Chi-Minh-Stadt',
        degree: 'Bachelor in Grafikdesign & Digitale Interaktion',
        honors: 'Mit Auszeichnung abgeschlossen - GPA 3.8/4.0'
      }
    ],
    projects: [
      {
        name: 'FinFlow - Intelligente Finanz-App',
        role: 'Produktdesigner',
        description: 'KI-gestützte persönliche Finanz-App mit Ausgabenanalyse.'
      }
    ],
    languages: [
      { name: 'Vietnamesisch', level: 'Muttersprache' },
      { name: 'Englisch', level: 'Verhandlungssicher (IELTS 7.5)' },
      { name: 'Deutsch', level: 'Grundkenntnisse' }
    ]
  }
};

/**
 * Translates an entire CV Document to the target language
 */
export function translateCV(cv: CVDocument, targetLang: string): CVDocument {
  const langPack = TRANSLATION_MAP[targetLang] || TRANSLATION_MAP['en'];
  if (!langPack) return cv;

  // Clone document
  const updated: CVDocument = JSON.parse(JSON.stringify(cv));

  // 1. Translate section titles
  updated.sectionTitles = {
    ...langPack.sectionTitles
  };

  // 2. Translate personal job title if matches common role
  for (const [key, value] of Object.entries(langPack.jobTitles)) {
    if (updated.personalInfo.jobTitle.toLowerCase().includes(key.toLowerCase())) {
      updated.personalInfo.jobTitle = value;
      break;
    }
  }

  // 3. Translate profile summary if matches default or fallback
  if (langPack.profileBio) {
    updated.profileSummary = langPack.profileBio;
  }

  // 4. Translate experiences
  if (langPack.experiences && langPack.experiences.length > 0) {
    updated.experiences = updated.experiences.map((exp, idx) => {
      const translation = langPack.experiences[idx] || langPack.experiences[0];
      return {
        ...exp,
        role: translation.role || exp.role,
        company: translation.company || exp.company,
        period: translation.period || exp.period,
        description: translation.description || exp.description,
        bullets: translation.bullets || exp.bullets,
      };
    });
  }

  // 5. Translate educations
  if (langPack.educations && langPack.educations.length > 0) {
    updated.educations = updated.educations.map((edu, idx) => {
      const translation = langPack.educations[idx] || langPack.educations[0];
      return {
        ...edu,
        school: translation.school || edu.school,
        degree: translation.degree || edu.degree,
        honors: translation.honors || edu.honors,
      };
    });
  }

  // 6. Translate projects
  if (langPack.projects && langPack.projects.length > 0) {
    updated.projects = updated.projects.map((proj, idx) => {
      const translation = langPack.projects[idx] || langPack.projects[0];
      return {
        ...proj,
        name: translation.name || proj.name,
        role: translation.role || proj.role,
        description: translation.description || proj.description,
      };
    });
  }

  // 7. Translate languages
  if (langPack.languages && langPack.languages.length > 0) {
    updated.languages = updated.languages.map((item, idx) => {
      const translation = langPack.languages[idx];
      if (translation) {
        return {
          ...item,
          name: translation.name,
          level: translation.level,
        };
      }
      return item;
    });
  }

  return updated;
}
