# ow2-scrimtime-ws
WebSocket server for LogTime/ScrimTime OW2 Workshop.

Watches the .csv file outputted and structures the data into JSON format.


## <a id="prerequisites">Prerequisites</a>

### <a id="clone">Clone/Download the project</a>

### <a id="install-node">Install Node.js</a>
***Tested with Node.js version 16.x.x. Might work with other versions idk***

### <a id="install-yarn">Install yarn</a>

### <a id="install-dependencies">Install dependencies</a>

```
cd project/directory
yarn
```

### Running 
Change this line to your correct Workshop directory path
https://github.com/OverPowered-Network/ow2-scrimtime-ws/blob/f47e5a4726c5b099e52b8506109d65270121dba3/src/parser.ts#L15

```
yarn start
```

Connect to the WebSocket and send the message `START`
The server will now look for the newest file in the directory and start watching for file changes.

Data structure will look like

```
interface OW2_API {
    map?: string
    round_status?: "match_end" | "round_start" | "round_end"
    players?: {
        [key: string]: OW2_Players_API
    }
    player_stats?: { [key: string]: OW2_POST_MAP_STATS }
}

interface OW2_Players_API {
    hero?: string
    playerName?: string
    kills?: number
    deaths?: number
    off_assists?: number
    def_assists?: number
    ultimate_status?: "ended" | "charged" | "started"
}

interface OW2_POST_MAP_STATS {
    round?: number
    heroList?: string[]
    eliminations?: number
    final_blows?: number
    deaths?: number
    hero_damage?: number
    healing_dealt?: number
    damage_taken?: number
    damage_mitigated?: number
    defensive_assists?: number
    offensive_assists?: number
    weapon_accuracy?: number
}
```
