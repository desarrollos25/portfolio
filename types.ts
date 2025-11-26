export interface PortfolioData {
  url: string;
  desktopImage: string;
  mobileImage: string;
  title: string;
  description: string;
  tags: string[];
}

export interface ScreenshotState {
  isLoading: boolean;
  error: string | null;
  data: PortfolioData | null;
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE'
}