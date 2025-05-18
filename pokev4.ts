
import { Array, Match, Schema as S, Option, Order, HashMap, pipe } from "effect"
import { getFulfilledValues } from "./PokeHelperFuncs"
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
    searchInput: S.String,
    pokeGens: S.HashMap({ key: S.Number, value: S.String}),
    pokeData: S.Array(PokeModel),
    isFetching: S.Boolean,
    gotFetched: S.Boolean,
    error: S.String,
})

const init_PokeModels = PokeModels.make({
    searchInput: "",
    pokeGens: HashMap.make(
        [1, "PersonalityCheck"]), 
    pokeData: [],
    isFetching: false,
    gotFetched: false, 
    error: ""
    })

const default_pokeModels: PokeModels = PokeModels.make({
    searchInput: "",
    pokeGens: HashMap.empty(),
    pokeData: [],
    isFetching: false,
    gotFetched: false, 
    error: ""
})

type PokeMsg = typeof PokeMsg.Type
const PokeMsg = S.Union(
    S.TaggedStruct("Search",{
        text: S.String
    }),
    S.TaggedStruct("Error", {
        error: S.String
    }),
    S.TaggedStruct("Success", {
        poke_data: S.Array(S.Any)
    }),
    S.TaggedStruct("toggleGen1", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen2", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen3", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen4", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen5", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen6", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen7", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen8", {
        toggled: S.Boolean
    }),
        S.TaggedStruct("toggleGen9", {
        toggled: S.Boolean
    })
)
const [changeSearch, searchError, searchSuccess, toggleGen1, toggleGen2, toggleGen3, toggleGen4, toggleGen5, toggleGen6, toggleGen7, toggleGen8, toggleGen9] = PokeMsg.members

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
        Match.tag("Search", ({text}) => {
            return {
                    model: PokeModels.make({
                        ...model,
                        searchInput: text,
                        isFetching: true
                    }),
                    cmd: Cmd.ofSub(async (dispatch: (msg: PokeMsg) => void) => {
                        try {
                            let genURLS: string[] = []
                            for (const key of HashMap.keys(model.pokeGens)){
                                genURLS = Array.append(genURLS, `https://pokeapi.upd-dcs.work/api/v2/generation/${key}/`)
                            }
                            
                            console.log(model.pokeGens)
                            let genPromises = await getFulfilledValues(Array.map(genURLS, (gen) => fetch(gen)))
                            let genSpecies =  await getFulfilledValues(Array.map(genPromises, async (resp) => {
                                const js = await resp.json()
                                return js.pokemon_species 
                            }))
                            
                            let unitedSpecies = Array.reduce(genSpecies, [] as string[], (acc, spc) => Array.union(acc, spc))
                            console.log(unitedSpecies)
                            let searchArray: string[] = [] 
                            if (text === ""){
                                searchArray = Array.map(unitedSpecies, (obj: any) => obj.name)
                            }else{
                                searchArray = Array.filter(unitedSpecies, (obj: any) => obj.name.startsWith(text) ? true : false)
                                searchArray = Array.map(searchArray, (obj: any) => obj.name)
                            }
                            
                
                            const poke = await getFulfilledValues(Array.map(searchArray, (name: string) => fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${name.toLowerCase()}`)))
    
                            let pokeData = await getFulfilledValues(Array.map(poke, (obj: any) => obj.json()))
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
    Match.tag("toggleGen1", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 1, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 1)
        })
    ),

    Match.tag("toggleGen2", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 2, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 2)
        })
    ),
    Match.tag("toggleGen3", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 3, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 3)
        })
    ),
    Match.tag("toggleGen4", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 4, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 4)
        })
    ),
    Match.tag("toggleGen5", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 5, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 5)
        })
    ),
    Match.tag("toggleGen6", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 6, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 6)
        })
    ),
    Match.tag("toggleGen7", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 7, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 7)
        })
    ),
    Match.tag("toggleGen8", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 8, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 8)
        })
    ),
    Match.tag("toggleGen9", ({toggled}) => toggled ? PokeModels.make({
            ...model,
            pokeGens: HashMap.set(model.pokeGens, 9, "PersonalityCheck")
        })
        : PokeModels.make({
            ...model,
            pokeGens: HashMap.remove(model.pokeGens, 9)
        })
    ),

    Match.tag("Error", ({error}) => PokeModels.make({
            ...default_pokeModels,
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
                        changeSearch.make({
                        text: (e.target as HTMLInputElement).value,
                    }))
            }
        }),

        h("input", {
            props:{
                type: 'checkbox',
                checked: true
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen1.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 1  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen2.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 2  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen3.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 3  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen4.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 4  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen5.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 5  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen6.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 6  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen7.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 7  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen8.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 8  "),

        h("input", {
            props:{
                type: 'checkbox',
                checked: false
            },

            on: {
                change: (e) => {
                    dispatch(toggleGen9.make({
                        toggled: (e.target as  HTMLInputElement).checked
                    }))

                    dispatch(changeSearch.make({
                        text: model.searchInput
                    }))
            }
            }
        }, 
    ),

        h("span", " Gen 9  "),


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


    
    

const root = document.getElementById("pokev4")!

startModelCmd(root, init_PokeModels, update, view)