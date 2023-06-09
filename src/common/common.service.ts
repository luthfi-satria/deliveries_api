import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CommonService {
  constructor(private httpService: HttpService) {}

  async postHttp(
    url: string,
    body?: Record<string, any>,
    headers?: Record<string, any>,
  ): Promise<AxiosResponse<any>> {
    const post_response = this.httpService
      .post(url, body, { headers: headers })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data;
        }),
        catchError((err) => {
          // throw err;
          throw err.response.data;
        }),
      );
    try {
      return await lastValueFrom(post_response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getHttp(url: string): Promise<AxiosResponse<any>> {
    const post_response = this.httpService.get(url).pipe(
      map((axiosResponse: AxiosResponse) => {
        return axiosResponse.data;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
    try {
      return await lastValueFrom(post_response);
    } catch (error) {
      return null;
    }
  }

  async deleteHttp(
    url: string,
    data?: any,
    headers?: Record<string, any>,
  ): Promise<AxiosResponse<any>> {
    const post_response = this.httpService
      .delete(url, { headers: headers, data: data })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data;
        }),
        catchError((err) => {
          throw err.response.data;
        }),
      );
    try {
      return await lastValueFrom(post_response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
