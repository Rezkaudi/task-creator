import { ALLOWED_USER_IDS } from '../../shared/constants/access-control';

export class AccessControlService {
  static checkAccess(): boolean {
    const userId = figma.currentUser?.id;
    const userName = figma.currentUser?.name;
    
    if (!userId) {
      figma.notify('⛔Your identity cannot be determined.', { error: true });
      return false;
    }

    console.log('User ID:', userId);
    console.log('User Name:', userName);

    if (!ALLOWED_USER_IDS.includes(userId)) {
      figma.notify(
        `⛔you are not authorized `, 
        { 
          error: true,
          timeout: 10000 
        }
      );
      
      return false;
    }

    return true;
  }
}