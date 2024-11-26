import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class CreciService {
  async validateCreci(creci: string) {
    const options = {
      hostname: 'api.buscacreci.com.br',
      port: 443,
      path: `/?creci=${encodeURIComponent(creci)}`,
      method: 'GET',
      rejectUnauthorized: false,
    };

    console.log('Iniciando requisição para API CRECI...');
    console.log('Opções:', options);

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Headers:', res.headers);

        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('Resposta da API CRECI:', data);
            resolve(JSON.parse(data));
          } else {
            console.error('Erro da API CRECI:', data);
            reject(
              new HttpException(
                data,
                res.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
              ),
            );
          }
        });
      });

      req.on('error', (err) => {
        console.error('Erro ao conectar à API CRECI:', err.message);
        reject(
          new HttpException(
            'Erro ao conectar à API CRECI',
            HttpStatus.INTERNAL_SERVER_ERROR,
          ),
        );
      });

      req.end();
    });
  }
}
