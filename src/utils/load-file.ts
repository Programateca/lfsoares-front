export function loadFile(url: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error("Failed to load file"));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error"));
    };

    xhr.send();
  });
}
