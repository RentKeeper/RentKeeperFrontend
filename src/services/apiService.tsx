import axios from 'axios';
import Cookies from 'js-cookie';

function ApiService() {
  const baseURL = "http://localhost:5100/api";
  const appendRoute = (route: string) => `${baseURL}/${route}`;

  const headerConfig = () => {
    const auth = Cookies.get("token");

    return {
      headers: {
        'Content-Type': 'application/json',
        ...(auth && { Authorization: `Bearer ${auth}` })
      }
    };
  };

  const get = async (route: string) => {
    return axios.get(appendRoute(route), headerConfig());
  };

  const post = async (route: string, data: any) => {
    return axios.post(appendRoute(route), data, headerConfig());
  };

  const put = async (route: string, data: any) => {
    return axios.put(appendRoute(route), data, headerConfig());
  };

  const del = async (route: string) => {
    return axios.delete(appendRoute(route), headerConfig());
  };

  return {
    get,
    post, 
    put,
    del
  };
}

export default ApiService;