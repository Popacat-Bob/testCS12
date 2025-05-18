import {Array } from "effect" 

export const getFulfilledValues = async (p: Promise<any>[]) => Array.map(Array.filter(await Promise.allSettled(p), (pr) => pr.status === "fulfilled" ? true : false), (pr) => (pr as PromiseFulfilledResult<any>).value)
 

    