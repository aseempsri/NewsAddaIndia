import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeletePasswordService {
  // Password for permanent deletion - Change this to your desired password
  private readonly DELETE_PASSWORD = 'DELETE123';

  /**
   * Verify the password for permanent deletion
   * @param password The password to verify
   * @returns true if password is correct, false otherwise
   */
  verifyPassword(password: string): boolean {
    return password === this.DELETE_PASSWORD;
  }

  /**
   * Get the password (for display purposes only - not recommended for production)
   * In production, this should be removed or secured differently
   */
  getPassword(): string {
    return this.DELETE_PASSWORD;
  }
}

