
import { Array, Match, Schema as S, pipe, Option, Order } from "effect"
import { h, startModelCmd,Cmd} from "cs12242-mvu/src"


const pokeIndexSort = Order.mapInput(Order.number, (poke: any) => poke.id)

type PokeModel = typeof PokeModel.Type 
const PokeModel = S.Struct({
    name: S.String,
    sprites: S.String,
    type: S.String,
    height: S.Option(S.Number),
    weight: S.Option(S.Number),
})

type PokeModels = typeof PokeModels.Type 
const PokeModels = S.Struct({
    pokeData: S.Array(PokeModel),
    searchInput: S.String,
    isFetching: S.Boolean,
    gotFetched: S.Boolean,
    error: S.String,
})

const init_PokeModels: PokeModels = PokeModels.make({
    pokeData: [],
    searchInput: "",
    isFetching: false,
    gotFetched: false, 
    error: ""
})

type PokeMsg = typeof PokeMsg.Type
const PokeMsg = S.Union(
    S.TaggedStruct("SearchName",{
        text: S.String
    }),
    S.TaggedStruct("SearchOnPressed", {}),
    S.TaggedStruct("Error", {
        error: S.String
    }),
    S.TaggedStruct("Success", {
        poke_data: S.Array(S.Any)
    })
)
const [changeSearchName, searchPressed, searchError, searchSuccess] = PokeMsg.members

const pokeModelizeJson = (obj: any) =>
    PokeModel.make({
        name: obj.name,
        sprites: obj.sprites.front_default,
        type: Array.map(obj.types, (obj: any) => obj.type.name).join(" | "),
        height: Option.some(parseFloat(JSON.stringify(obj.height/10))),
        weight: Option.some(parseFloat(JSON.stringify(obj.weight/10)))
    })

const update = (msg: PokeMsg, model: PokeModels) =>
    Match.value(msg).pipe(
        Match.tag("SearchName", ({text}) => PokeModels.make({
            ...model,
            searchInput: text,
        })), 
        Match.tag("SearchOnPressed", () => {
            return {
                model: PokeModels.make({
                    ...model,
                    isFetching: true
                }),
                cmd: Cmd.ofSub(async (dispatch: (msg: PokeMsg) => void) => {
                    try {
                        const gen = await fetch("https://pokeapi.upd-dcs.work/api/v2/generation/1/")
                        const genData = await gen.json()
                        const pokemon_species = genData.pokemon_species

                        let searchArray: string[] = [] 
                        if (model.searchInput === ""){
                            searchArray = Array.map(pokemon_species, (obj: any) => obj.name)
                        }else{
                            searchArray = Array.filter(pokemon_species, (obj: any) => obj.name.startsWith(model.searchInput) ? true : false)
                            searchArray = Array.map(searchArray, (obj: any) => obj.name)
                        }
                        
            
                        const poke = await Promise.all(Array.map(searchArray, (name: string) => fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${name.toLowerCase()}`)))

                        let PokePromise = await Promise.allSettled(Array.map(poke, (obj: any) => obj.json()))
                        PokePromise = Array.filter(PokePromise, (promise) => promise.status === "fulfilled" ? true : false) //fixes errrors related to the API itself

                        let pokeData = Array.map(PokePromise, (promise) => (promise as PromiseFulfilledResult<object>).value)
                        pokeData = Array.sort(pokeData, pokeIndexSort)
                        const pokeModelData = Array.reduce(pokeData, [] as any, (arr, obj) => {
                            try{
                                return Array.append(arr, pokeModelizeJson(obj))
                            }catch{
                                return arr
                            }
                        })

                        dispatch(searchSuccess.make({
                            poke_data: pokeModelData
                        }))

                    } catch (e) {
                        dispatch(searchError.make({
                            error: "Failed to fetch data"
                        }))
                    }
                })
            }
        }),
        Match.tag("Error", ({error}) => PokeModels.make({
            ...init_PokeModels,
            searchInput: model.searchInput,
            error: error
        })),
        Match.tag("Success", ({poke_data}) => PokeModels.make({
            ...model,
            gotFetched: true,
            isFetching: false,
            error: "",
            pokeData: poke_data
        })),
        Match.exhaustive,
    )

const view = (model: PokeModels, dispatch: (msg: PokeMsg) => void) =>
    h("div", [
        h("input", {
            type: "text",
            on: {
                input: (e) =>
                    dispatch(
                        changeSearchName.make({
                        text: (e.target as HTMLInputElement).value,
                    }))
            }
        }),
        h("button", {
            on: {
                click: () => dispatch(searchPressed.make())
            }
        },
        "Search"
    ),
    h("div", {
        props:{
            style: 'display: grid; grid-template-columns: auto auto auto;'
        }
    },
        model.isFetching ? "Loading..."
        :model.error ? model.error
        :model.gotFetched ? showPokeData(model.pokeData as PokeModel[])
        :""
    ),
    ])

const showPokeData = (pokeData: PokeModel[]) => Array.map(pokeData, (obj) => makePokeBox(obj))
const makePokeBox = (obj: PokeModel) =>
    h("div",{
        props: {
            style: "display: flex; align-items: center; gap: 1em"
        }
    },
    [
        h("img", {
                props: {
                    src: obj.sprites,
                    alt: `This is a ${obj.name}`
                }
            }),

        h("div", [
            h("h1", obj.name.toUpperCase()),
            h("code", `\n${obj.type}`),
            h("p", `Height: ${Option.getOrNull(obj.height)} m`),
            h("p", `Weight: ${Option.getOrNull(obj.weight)} kg`)

        ] )
        
            
    ])


    
    

const root = document.getElementById("pokev3")!

startModelCmd(root, init_PokeModels, update, view)