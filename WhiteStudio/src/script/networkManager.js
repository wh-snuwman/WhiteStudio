import { wingAPI } from "./wingAPI/wingAPI.js";

export const wing = new wingAPI();


export async function initNetwork(serverUrl) {
    await wing.connect(serverUrl);

}