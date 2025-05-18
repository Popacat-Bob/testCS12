import { Array, Match, HashMap, Schema as S, pipe, Option } from "effect"
import { none } from "effect/Option"
import { Any } from "effect/Schema"
import { h, startModelCmd,Cmd, startSimple } from "cs12242-mvu/src"

type PokeModel = typeof PokeModel.Type 
const PokeModel = S.Struct({
    name: S.String,
    sprites: S.String,
    type: S.String,
    height: S.Option(S.Number),
    weight: S.Option(S.Number),
    searchInput: S.String,
    isFetching: S.Boolean,
    gotFetched: S.Boolean,
    error: S.String,
})

const init_PokeModel: PokeModel = PokeModel.make({
    name: "",
    sprites: "",
    type: "",
    height: Option.none(),
    weight: Option.none(),
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
        poke_name: S.String,
        poke_sprites: S.String,
        poke_type: S.Array(S.String),
        poke_height: S.String,
        poke_weight: S.String,
    })
)
const [changeSearchName, searchPressed, searchError, searchSuccess] = PokeMsg.members

const update = (msg: PokeMsg, model: PokeModel) =>
    Match.value(msg).pipe(
        Match.tag("SearchName", ({text}) => PokeModel.make({
            ...model,
            searchInput: text,
        })), 
        Match.tag("SearchOnPressed", () => {
            return {
                model: PokeModel.make({
                    ...model,
                    isFetching: true
                }),
                cmd: Cmd.ofSub(async (dispatch: (msg: PokeMsg) => void) => {
                    try {
                        if (model.searchInput === ""){
                            throw Error("Are you bobo?")
                        }
                        const get = await fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${model.searchInput.toLowerCase()}`)
                        const pokeData = await get.json()

                        dispatch(searchSuccess.make({
                            poke_name: pokeData.name,
                            poke_sprites: pokeData.sprites.front_default,
                            poke_type: Array.map(pokeData.types, (obj: any) => obj.type.name),
                            poke_height: JSON.stringify(pokeData.height/10),
                            poke_weight: JSON.stringify(pokeData.weight/10)
                        }))
                        console.log(pokeData.sprites.front_default)
                    } catch (e) {
                        dispatch(searchError.make({
                            error: "Failed to fetch data"
                        }))
                    }
                })
            }
        }),
        Match.tag("Error", ({error}) => PokeModel.make({
            ...init_PokeModel,
            searchInput: model.searchInput,
            error: error
        })),
        Match.tag("Success", ({poke_name, poke_type, poke_height, poke_weight, poke_sprites}) => PokeModel.make({
            ...model,
            gotFetched: true,
            isFetching: false,
            error: "",
            name: poke_name,
            sprites: poke_sprites,
            type: poke_type.join(" | "),
            height: Option.some(parseFloat(poke_height)),
            weight: Option.some(parseFloat(poke_weight))
        })),
        Match.exhaustive,
    )

const view = (model: PokeModel, dispatch: (msg: PokeMsg) => void) =>
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
    h("pre",
        model.isFetching ? "Loading..."
        :model.error ? model.error
        :model.gotFetched ? h("p", [
            h("h1", model.name.toUpperCase()),
            h("img", {
                props: {
                    src: model.sprites,
                    alt: `This is a ${model.name}`
                }
            }),
            h("code", `\n${model.type}`),
            h("p", `Height: ${Option.getOrNull(model.height)} m`),
            h("p", `Weight: ${Option.getOrNull(model.weight)} kg`)
        
        ])
        :""
        
    ),
    ])
    
    

const root = document.getElementById("pokev2")!

startModelCmd(root, init_PokeModel, update, view)
