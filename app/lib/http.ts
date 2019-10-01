interface IHttpResponse<T> extends Response {
  parsedBody?: T;
}

const http = <T>(request: RequestInfo): Promise<IHttpResponse<T>> => {
  return new Promise((resolve, reject) => {
    let response: IHttpResponse<T>;
    fetch(request)
      .then(res => {
        response = res;
        return res.json();
      })
      .then(body => {
        response.parsedBody = body;
        if (response.ok) {
          resolve(response);
        } else {
          reject(response);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

export const get = async <T>(
  path: string,
  headers: HeadersInit,
  args: RequestInit = { method: "get", headers: headers }
): Promise<IHttpResponse<T>> => {
  return await http<T>(new Request(path, args));
};
 
export const post = async <T>(
  path: string,
  headers: HeadersInit,
  body: any,
  args: RequestInit = { method: "post", headers: headers, body: JSON.stringify(body) }
): Promise<IHttpResponse<T>> => {
  return await http<T>(new Request(path, args));
};
 
export const put = async <T>(
  path: string,
  body: any,
  args: RequestInit = { method: "put", body: JSON.stringify(body) }
): Promise<IHttpResponse<T>> => {
  return await http<T>(new Request(path, args));
};

export const patch = async <T>(
  path: string,
  body: any,
  args: RequestInit = { method: "patch", body: JSON.stringify(body) }
): Promise<IHttpResponse<T>> => {
  return await http<T>(new Request(path, args));
};

export const remove = async <T>(
  path: string,
  body: any,
  args: RequestInit = { method: "delete", body: JSON.stringify(body) }
): Promise<IHttpResponse<T>> => {
  return await http<T>(new Request(path, args));
};