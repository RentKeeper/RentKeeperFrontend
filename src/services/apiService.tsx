import axios from 'axios';
import Cookies from 'js-cookie';

const resolveToken = () => {
  const cookieToken = Cookies.get("token");
  if (cookieToken) {
    return cookieToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const localToken = window.localStorage?.getItem("token");
    if (localToken) {
      return localToken;
    }

    const sessionToken = window.sessionStorage?.getItem("token");
    if (sessionToken) {
      return sessionToken;
    }
  } catch {
    return null;
  }

  return null;
};

function ApiService() {
  const baseURL = "http://localhost:5100/api";
  const appendRoute = (route: string) => `${baseURL}/${route}`;

  const headerConfig = () => {
    const auth = resolveToken();

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