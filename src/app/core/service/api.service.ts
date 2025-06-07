import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Create HTTP headers with authentication token
   */
  private createHeaders(includeAuth: boolean = true): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (includeAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Perform GET request
   */
  get<T>(endpoint: string, params?: any, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<T>(url, {
      headers: this.createHeaders(includeAuth),
      params: httpParams
    });
  }

  /**
   * Perform POST request
   */
  post<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.post<T>(url, data, {
      headers: this.createHeaders(includeAuth)
    });
  }

  /**
   * Perform PUT request
   */
  put<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.put<T>(url, data, {
      headers: this.createHeaders(includeAuth)
    });
  }

  /**
   * Perform PATCH request
   */
  patch<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.patch<T>(url, data, {
      headers: this.createHeaders(includeAuth)
    });
  }

  /**
   * Perform DELETE request
   */
  delete<T>(endpoint: string, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.delete<T>(url, {
      headers: this.createHeaders(includeAuth)
    });
  }

  /**
   * Upload file
   */
  uploadFile<T>(endpoint: string, file: File, additionalData?: any, includeAuth: boolean = true): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    let headers = new HttpHeaders();
    if (includeAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return this.http.post<T>(url, formData, {
      headers
    });
  }
}
