import { Array } from "effect"
import { reject } from "effect/STM"

/* async function hi(pokemon1: string, pokemon2: string){
    try {
        const get1 = await fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${pokemon1.toLowerCase()}`);
        const data1 = await get1.json();
        const get2 = await fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${pokemon1.toLowerCase()}`);
        const data2 = await get2.json()
    } catch (error){
        console.log("gay")
    }
}

hi("pikachu") */

async function test(searchPokemon: string){
    /* const poke = await Promise.all(Array.map(pokemon, (poke) => fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${poke.toLowerCase()}`)))
    const poke_data = await Promise.all(Array.map(poke, (v) => v.json())) */
    

    const gen = await fetch("https://pokeapi.upd-dcs.work/api/v2/generation/1/")
    const gen_data = await gen.json()
    const pokemon_species = gen_data.pokemon_species

    let searchArray: string[] = [] 
    if (searchPokemon === ""){
        searchArray = Array.map(pokemon_species, (obj: any) => obj.name)
    }else{
        searchArray = Array.filter(pokemon_species, (obj: any) => obj.name.startsWith(searchPokemon) ? true : false)
        searchArray = Array.map(searchArray, (obj: any) => obj.name)
    }

    const poke = await Promise.all(Array.map(searchArray, (name: string) => fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${name.toLowerCase()}`)))
    const poke_data = await Promise.all(Array.map(poke, (obj: any) => obj.json()))
}

function f() {
  return new Promise((resolve) => {
    // O(1) work
    resolve("f done");
  });
}

function g(n) {
  return new Promise((resolve) => {
    // O(n) work
    for (let i = 0; i < n; i++) {
      // some work
    }
    resolve("g done");
  });
} 

let x = f()

let y = g(1000)

y.then(() => console.log("gyatt"))
x.then((() =>console.log("gay")))