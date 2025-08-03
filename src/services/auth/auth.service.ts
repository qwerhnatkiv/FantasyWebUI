// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private apiUrl = 'https://qwerhnatkiv-backend.azurewebsites.net/login';
  
  constructor(private http: HttpClient) {}

  /**
   * Sends login request to API and sets bearer token to local storage in case of success
   * @param username Username
   * @param password Password
   * @returns Observable to subscribe for
   */
  public login(username: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { username, password }, { responseType: 'text' }).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response);
      })
    );
  }

  /**
   * Removes bearer token from local storage disabling user interactions with web resource
   */
  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Determines whether user is authenticated or not
   * @returns True if token exists, otherwise false
   */
  public isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Returns token
   * @returns Bearer token from local storage
   */
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
