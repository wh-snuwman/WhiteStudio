import { wingAPI } from "./wingAPI/wingAPI.js";

export const wing = new wingAPI();


export async function initNetwork(serverUrl, username, password) {
    await wing.connect(serverUrl);

    wing.signupOk(() => {
        wing.login(username, password);
    });

    wing.loginOk(() => {
        console.log("로그인 성공");
    });
}