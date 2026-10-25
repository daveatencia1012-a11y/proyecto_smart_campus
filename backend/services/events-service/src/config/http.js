import axios from 'axios';

const http = axios.create({ timeout: 5000, maxRedirects: 0 });
http.interceptors.request.use(config => {
  const deadline = AbortSignal.timeout(Math.min(config.timeout || 5000, 5000));
  config.signal = config.signal ? AbortSignal.any([config.signal, deadline]) : deadline;
  return config;
});
http.interceptors.response.use(response => response, error => {
  const timeout = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED'].includes(error.code);
  const upstream = error.response?.status;
  const status = timeout ? 504 : upstream >= 400 && upstream < 500 ? upstream : 502;
  return Promise.reject(Object.assign(new Error(timeout ? 'Tiempo de espera del servicio agotado' : 'Error al consultar otro servicio'), {
    status, statusCode: status, code: error.code
  }));
});
export default http;
