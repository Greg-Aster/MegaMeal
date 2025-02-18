import { siteConfig, profileConfig } from '../config';

const dynamicAvatars: { [key: string]: string } = {
  home: '/src/assets/images/avatar.png',
  about: '/src/assets/images/demo-avatar.png',
  contact: '/src/assets/images/demo-avatar.png',
};

const getDynamicData = () => {
  return {
    avatar: dynamicAvatars.home,
    themeColor: {
      hue: 300,
      fixed: true,
    },
  };
};

export const dynamicConfig = {
  ...siteConfig,
  ...profileConfig,
  ...getDynamicData(),
  dynamicAvatars,
};