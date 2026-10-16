export interface PopularToolDef {
  id: string;
  name: string;
  category: 'design' | 'frontend' | 'backend' | 'devops' | 'productivity';
  bgColor: string;
  textColor: string;
  iconSvg: string;
}

export const POPULAR_TOOLS: PopularToolDef[] = [
  // DESIGN
  {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    bgColor: '#0ACF83',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 38 57" fill="none" class="w-full h-full"><path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/><path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/><path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/><path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/><path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/></svg>`
  },
  {
    id: 'photoshop',
    name: 'Adobe Photoshop',
    category: 'design',
    bgColor: '#001E36',
    textColor: '#31A8FF',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#001E36"/><path d="M6 6H11C13.2 6 14.5 7.2 14.5 9.2C14.5 11.2 13.2 12.4 11 12.4H8.2V18H6V6ZM8.2 10.6H10.7C11.8 10.6 12.3 10.1 12.3 9.2C12.3 8.3 11.8 7.8 10.7 7.8H8.2V10.6Z" fill="#31A8FF"/><path d="M14.5 15.2C14.8 14.3 15.6 13.8 16.7 13.8C18.2 13.8 19 14.6 19 15.9V18H17.2V16.1C17.2 15.4 16.8 15 16.1 15C15.4 15 14.9 15.5 14.9 16.2V18H13.1V13.9H14.5V15.2Z" fill="#31A8FF"/></svg>`
  },
  {
    id: 'illustrator',
    name: 'Adobe Illustrator',
    category: 'design',
    bgColor: '#330000',
    textColor: '#FF9A00',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#330000"/><path d="M5.5 18L9.2 6.5H11.3L15 18H12.9L12.1 15.4H8.4L7.6 18H5.5ZM9 13.6H11.5L10.3 9.4H10.2L9 13.6ZM16.5 7.5C16.5 6.8 17.1 6.2 17.8 6.2C18.5 6.2 19.1 6.8 19.1 7.5C19.1 8.2 18.5 8.8 17.8 8.8C17.1 8.8 16.5 8.2 16.5 7.5ZM16.8 10.2H18.8V18H16.8V10.2Z" fill="#FF9A00"/></svg>`
  },
  {
    id: 'adobexd',
    name: 'Adobe XD',
    category: 'design',
    bgColor: '#470137',
    textColor: '#FF61F6',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#470137"/><text x="4" y="17" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FF61F6">Xd</text></svg>`
  },
  {
    id: 'premiere',
    name: 'Premiere Pro',
    category: 'design',
    bgColor: '#00005B',
    textColor: '#EA77FF',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#00005B"/><text x="4" y="17" font-family="sans-serif" font-weight="bold" font-size="12" fill="#EA77FF">Pr</text></svg>`
  },
  {
    id: 'aftereffects',
    name: 'After Effects',
    category: 'design',
    bgColor: '#00005B',
    textColor: '#9999FF',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#00005B"/><text x="4" y="17" font-family="sans-serif" font-weight="bold" font-size="12" fill="#9999FF">Ae</text></svg>`
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'design',
    bgColor: '#00C4CC',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="12" fill="#00C4CC"/><path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM10.5 15.5C8.5 15.5 7.5 13.8 7.5 12C7.5 10.2 8.5 8.5 10.5 8.5C12.1 8.5 12.8 9.5 12.8 9.5L11.7 10.5C11.7 10.5 11.2 9.8 10.5 9.8C9.5 9.8 9 10.8 9 12C9 13.2 9.5 14.2 10.5 14.2C11.3 14.2 11.8 13.5 11.8 13.5L12.9 14.5C12.9 14.5 12.1 15.5 10.5 15.5Z" fill="white"/></svg>`
  },
  {
    id: 'blender',
    name: 'Blender 3D',
    category: 'design',
    bgColor: '#EA7600',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="6" fill="#EA7600"/><circle cx="12" cy="12" r="5" fill="#22578A"/><circle cx="12" cy="12" r="2.5" fill="#E87D0D"/></svg>`
  },

  // FRONTEND
  {
    id: 'react',
    name: 'React.js',
    category: 'frontend',
    bgColor: '#20232A',
    textColor: '#61DAFB',
    iconSvg: `<svg viewBox="-11.5 -10.23174 23 20.46348" class="w-full h-full"><circle cx="0" cy="0" r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'frontend',
    bgColor: '#3178C6',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#3178C6"/><path d="M5 10H11V12H9V19H7V12H5V10Z" fill="white"/><path d="M12.5 17.5C13.2 17.8 14.1 18 15 18C16.8 18 17.8 17.1 17.8 15.6C17.8 12.8 13.8 13.4 13.8 11.8C13.8 11 14.4 10.5 15.5 10.5C16.3 10.5 17 10.7 17.5 10.9L17.1 12.5C16.6 12.3 16 12.1 15.4 12.1C14.2 12.1 13.7 12.7 13.7 13.5C13.7 15.3 17.9 14.7 17.9 17.4C17.9 18.7 16.9 19.6 15.1 19.6C14 19.6 13.1 19.3 12.3 18.9L12.5 17.5Z" fill="white"/></svg>`
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'frontend',
    bgColor: '#000000',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><circle cx="12" cy="12" r="12" fill="black"/><path d="M7 7.5H9.2V16.5H7V7.5ZM16.5 16.5H14.3L10.2 10.7V7.5H12.4L16.5 13.3V7.5H18.7V16.5H16.5Z" fill="white"/></svg>`
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'frontend',
    bgColor: '#41B883',
    textColor: '#35495E',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><path d="M2 3.5H5.5L12 14.5L18.5 3.5H22L12 21L2 3.5Z" fill="#41B883"/><path d="M6 3.5H9.5L12 8L14.5 3.5H18L12 14L6 3.5Z" fill="#35495E"/></svg>`
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    category: 'frontend',
    bgColor: '#0F172A',
    textColor: '#38BDF8',
    iconSvg: `<svg viewBox="0 0 24 24" fill="#38BDF8" class="w-full h-full"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z"/></svg>`
  },
  {
    id: 'html5_css3',
    name: 'HTML5 & CSS3',
    category: 'frontend',
    bgColor: '#E34F26',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><path d="M3 2L5 19L12 22L19 19L21 2H3ZM16.8 7H7.7L8 10H16.5L15.9 16L12 17.1L8.1 16L7.9 13.5H9.9L10 14.7L12 15.2L14 14.7L14.3 12H7.9L7.3 5H17.1L16.8 7Z" fill="#ffffff"/></svg>`
  },

  // BACKEND & DATABASE
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'backend',
    bgColor: '#339933',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><path d="M12 2L3 7V17L12 22L21 17V7L12 2ZM17.5 15.2L12 18.4L6.5 15.2V8.8L12 5.6L17.5 8.8V15.2Z" fill="#ffffff"/></svg>`
  },
  {
    id: 'python',
    name: 'Python',
    category: 'backend',
    bgColor: '#3776AB',
    textColor: '#FFD43B',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#3776AB"/><circle cx="8" cy="8" r="1.5" fill="#FFD43B"/><circle cx="16" cy="16" r="1.5" fill="#3776AB"/></svg>`
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'backend',
    bgColor: '#336791',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><circle cx="12" cy="12" r="10" fill="#336791"/><path d="M12 6C9 6 7 8 7 11C7 15 10 18 12 18C14 18 17 15 17 11C17 8 15 6 12 6Z" fill="white"/></svg>`
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'devops',
    bgColor: '#2496ED',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#2496ED"/><path d="M6 11H8V13H6V11ZM9 11H11V13H9V11ZM12 11H14V13H12V11ZM9 8H11V10H9V8ZM12 8H14V10H12V8ZM15 8H17V10H15V8ZM4 14C4.5 16.5 7 18 12 18C17 18 19.5 16.5 20 14H4Z" fill="white"/></svg>`
  },

  // PRODUCTIVITY & MANAGEMENT
  {
    id: 'git_github',
    name: 'Git & GitHub',
    category: 'productivity',
    bgColor: '#181717',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="white" class="w-full h-full"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`
  },
  {
    id: 'vscode',
    name: 'VS Code',
    category: 'productivity',
    bgColor: '#007ACC',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#007ACC"/><path d="M17.5 4.5L12 8.5L7.5 5L4.5 7V17L7.5 19L12 15.5L17.5 19.5L20 18V6L17.5 4.5Z" fill="white"/></svg>`
  },
  {
    id: 'jira',
    name: 'Jira Software',
    category: 'productivity',
    bgColor: '#0052CC',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#0052CC"/><path d="M12 4C9 7 9 9 12 12C15 9 15 7 12 4Z" fill="white"/><path d="M8 8C5 11 5 13 8 16C11 13 11 11 8 8Z" fill="white" opacity="0.8"/></svg>`
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    bgColor: '#000000',
    textColor: '#ffffff',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#000000"/><path d="M6 6L14 5V17L7 18V6ZM14 5L18 6V18L14 17V5Z" fill="white"/></svg>`
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'productivity',
    bgColor: '#4A154B',
    textColor: '#ECB22E',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#4A154B"/><circle cx="8" cy="8" r="2" fill="#E01E5A"/><circle cx="16" cy="8" r="2" fill="#36C5F0"/><circle cx="8" cy="16" r="2" fill="#2EB67D"/><circle cx="16" cy="16" r="2" fill="#ECB22E"/></svg>`
  }
];
