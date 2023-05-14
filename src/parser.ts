import fs from "fs";
import path from "path";
import * as _ from "underscore";
import WebSocket, { Server as WebSocketServer } from "ws";
import { createServer, Server as httpServer } from "http";

/**
 * Replace with the correct static path to the scrim-time log files directory
 * C:\Users\{username}\OneDrive\Documents\Overwatch\Workshop
 * or
 * C:\Users\{username}\Documents\Overwatch\Workshop
 */
const baseDir = "C:/Users/rjame/OneDrive/Documents/Overwatch/Workshop";

const OW_EVENT_KEYS = {
  RND_S: "round_start",
  RND_E: "round_end",
  H_SPN: "hero_spawn",
  H_SWP: "hero_swap",
  OFF_ASS: "offensive_assist",
  DEF_ASS: "defensive_assist",
  ULT_CHG: "ultimate_charged",
  ULT_ST: "ultimate_start",
  ULT_END: "ultimate_end",
  P_STAT: "player_stat",
  M_REZ: "mercy_rez",
  K: "kill",
  M_END: "match_end",
};

// Return only base file name without dir
const getMostRecentFileName = (dir: string) => {
  const files = fs.readdirSync(dir);

  // use underscore for max()
  return _.max(files, function (file) {
    const fullpath = path.join(dir, file);

    // ctime = creation time is used
    // replace with mtime for modification time
    return fs.statSync(fullpath).ctime;
  });
};

let oldEvents: any[] = [];
let events: any[] = [];

function scrimCsvToArray(str: string, delimiter = ",") {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  const key = rows[1];

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    // console.log({ values });

    const key = values[1];
    if (key === OW_EVENT_KEYS.K) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
          recievingPlayer: {
            hero: values[8],
            playerName: values[7],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.OFF_ASS) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.DEF_ASS) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.OFF_ASS || key === OW_EVENT_KEYS.DEF_ASS) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.H_SPN) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.H_SWP) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      console.log("SWAP", el);

      return el;
    }

    if (
      key === OW_EVENT_KEYS.ULT_CHG ||
      key === OW_EVENT_KEYS.ULT_ST ||
      key === OW_EVENT_KEYS.ULT_END
    ) {
      const el = {
        [key]: {
          timestamp: values[2],
          team: values[3],
          player: {
            hero: values[5],
            playerName: values[4],
          },
        },
      };
      return el;
    }

    if (key === OW_EVENT_KEYS.P_STAT) {
      const el = {
        [key]: {
          round: values[3],
          hero: values[6],
          playerName: values[5],
          eliminations: values[7],
          final_blows: values[8],
          deaths: values[9],
          hero_damage: values[12],
          healing_dealt: values[13],
          damage_taken: values[16],
          damage_mitigated: values[17],
          weapon_accuracy: values[values.length - 2], // 2nd to last value. can't be bothered to find the index
        },
      };

      return el;
    }
    const el = {
      [key]: {
        timestamp: values[2],
        team: values[3],
      },
    };
    return el;
  });

  // return the array
  return arr;
}

const createDTO = (events: any) => {
  const PLAYER_STATS = {};
  const PLAYERS = {};
  const DTO = {};

  for (const event of events) {
    // console.log(event);
    if (event[OW_EVENT_KEYS.H_SPN]) {
      if (event?.[OW_EVENT_KEYS.H_SPN]?.player?.playerName) {
        // console.log(
        //   "CREATING PLAYER DTO",
        //   event?.[OW_EVENT_KEYS.H_SPN]?.player?.playerName
        // );

        PLAYERS[event?.[OW_EVENT_KEYS.H_SPN]?.player?.playerName] = {
          ...(PLAYERS?.[event?.[OW_EVENT_KEYS.H_SPN]?.player?.playerName] ||
            {}),
          ...event[OW_EVENT_KEYS.H_SPN].player,
        };

        DTO["players"] = { ...PLAYERS };
      }
    }

    if (event[OW_EVENT_KEYS.H_SWP]) {
      if (event?.[OW_EVENT_KEYS.H_SWP]?.player?.playerName) {
        // console.log("SWAPPING PLAYER DTO", event?.[OW_EVENT_KEYS.H_SWP]);

        PLAYERS[event?.[OW_EVENT_KEYS.H_SWP]?.player?.playerName] = {
          ...PLAYERS[event?.[OW_EVENT_KEYS.H_SWP]?.player?.playerName],
          ...event[OW_EVENT_KEYS.H_SWP].player,
        };

        DTO["players"] = { ...PLAYERS };
      }
    }

    if (event[OW_EVENT_KEYS.K]) {
      console.log(event[OW_EVENT_KEYS.K].recievingPlayer);
      if (event?.[OW_EVENT_KEYS.K]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.K]?.player?.playerName]) {
          // console.log(
          //   "ADDING KILL VALUE TO PLAYER",
          //   event?.[OW_EVENT_KEYS.K]?.player?.playerName
          // );
          if (PLAYERS[event?.[OW_EVENT_KEYS.K]?.player?.playerName].kills) {
            // console.log("INCREMENTING KILL VALUE TO PLAYER");
            PLAYERS[event?.[OW_EVENT_KEYS.K]?.player?.playerName].kills += 1;
          } else {
            // console.log("INITALIZING KILL VALUE TO PLAYER");
            PLAYERS[event?.[OW_EVENT_KEYS.K]?.player?.playerName].kills = 1;
          }

          // Log deaths of other player
          if (PLAYERS[event?.[OW_EVENT_KEYS.K]?.recievingPlayer?.playerName]) {
            if (
              PLAYERS[event?.[OW_EVENT_KEYS.K]?.recievingPlayer?.playerName]
                ?.deaths
            ) {
              // console.log("INCREMENTING DEATH VALUE TO PLAYER");
              PLAYERS[
                event?.[OW_EVENT_KEYS.K]?.recievingPlayer?.playerName
              ].deaths += 1;
            } else {
              // console.log("INITALIZING DEATH VALUE TO PLAYER");
              PLAYERS[
                event?.[OW_EVENT_KEYS.K]?.recievingPlayer?.playerName
              ].deaths = 1;
            }
          } else {
            // console.log("INITALIZING DEATH VALUE TO PLAYER");
            PLAYERS[event?.[OW_EVENT_KEYS.K]?.recievingPlayer?.playerName] = {
              ...event?.[OW_EVENT_KEYS.K]?.recievingPlayer,
              deaths: 1,
            };
          }

          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.OFF_ASS]) {
      if (event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName]) {
          // console.log(
          //   "ADDING OFF_ASSISTS VALUE TO PLAYER",
          //   event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName
          // );
          if (
            PLAYERS[event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName]
              .off_assists
          ) {
            // console.log("INCREMENTING OFF_ASSISTS VALUE TO PLAYER");
            PLAYERS[
              event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName
            ].off_assists += 1;
          } else {
            // console.log("INITALIZING OFF_ASSISTS VALUE TO PLAYER");
            PLAYERS[
              event?.[OW_EVENT_KEYS.OFF_ASS]?.player?.playerName
            ].off_assists = 1;
          }

          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.DEF_ASS]) {
      if (event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName]) {
          // console.log(
          //   "ADDING DEF_ASSISTS VALUE TO PLAYER",
          //   event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName
          // );
          if (
            PLAYERS[event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName]
              .def_assists
          ) {
            // console.log("INCREMENTING DEF_ASSISTS VALUE TO PLAYER");
            PLAYERS[
              event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName
            ].def_assists += 1;
          } else {
            // console.log("INITALIZING DEF_ASSISTS VALUE TO PLAYER");
            PLAYERS[
              event?.[OW_EVENT_KEYS.DEF_ASS]?.player?.playerName
            ].def_assists = 1;
          }

          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.ULT_CHG]) {
      if (event?.[OW_EVENT_KEYS.ULT_CHG]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.ULT_CHG]?.player?.playerName]) {
          PLAYERS[
            event?.[OW_EVENT_KEYS.ULT_CHG]?.player?.playerName
          ].ultimate_status = "charged";
          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.ULT_ST]) {
      if (event?.[OW_EVENT_KEYS.ULT_ST]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.ULT_ST]?.player?.playerName]) {
          PLAYERS[
            event?.[OW_EVENT_KEYS.ULT_ST]?.player?.playerName
          ].ultimate_status = "started";
          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.ULT_END]) {
      if (event?.[OW_EVENT_KEYS.ULT_END]?.player?.playerName) {
        if (PLAYERS[event?.[OW_EVENT_KEYS.ULT_END]?.player?.playerName]) {
          PLAYERS[
            event?.[OW_EVENT_KEYS.ULT_END]?.player?.playerName
          ].ultimate_status = "ended";
          DTO["players"] = PLAYERS;
        }
      }
    }

    if (event[OW_EVENT_KEYS.RND_S]) {
      DTO["round_status"] = "round_start";
    }

    if (event[OW_EVENT_KEYS.RND_E]) {
      for (const player in Object.keys(PLAYERS)) {
        if (PLAYERS[player]) {
          PLAYERS[player].hero = null;
          PLAYERS[player].ultimate_status = false;
        }
      }
      DTO["round_status"] = "round_end";
    }

    if (event[OW_EVENT_KEYS.M_END]) {
      DTO["round_status"] = "match_end";
    }

    if (event[OW_EVENT_KEYS.P_STAT]) {
      const playerName = event?.[OW_EVENT_KEYS.P_STAT]?.playerName;
      if (playerName) {
        const newRoundNo = parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.round);
        const oldRoundNo = PLAYER_STATS[playerName]?.round || 0;
        const newHero = event?.[OW_EVENT_KEYS.P_STAT]?.hero;
        const oldHero = PLAYER_STATS[playerName]?.hero || "";

        console.log(newRoundNo, oldRoundNo, newHero, oldHero);
        if (PLAYER_STATS[playerName]) {
          if (newRoundNo === oldRoundNo) {
            if (newHero !== PLAYER_STATS[playerName].hero) {
              console.log("Adding stats to", playerName, event);
              PLAYER_STATS[playerName].round = newRoundNo;
              PLAYER_STATS[playerName].hero = newHero;
              PLAYER_STATS[playerName].heroList.push(newHero);
              PLAYER_STATS[playerName].eliminations += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.eliminations
              );

              PLAYER_STATS[playerName].final_blows += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.final_blows
              );

              PLAYER_STATS[playerName].deaths += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.deaths
              );

              PLAYER_STATS[playerName].hero_damage += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.hero_damage
              );

              PLAYER_STATS[playerName].healing_dealt += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.healing_dealt
              );

              PLAYER_STATS[playerName].damage_taken += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.damage_taken
              );

              PLAYER_STATS[playerName].damage_mitigated += parseInt(
                event?.[OW_EVENT_KEYS.P_STAT]?.damage_mitigated
              );

              PLAYER_STATS[playerName].weapon_accuracy += parseFloat(
                event?.[OW_EVENT_KEYS.P_STAT]?.weapon_accuracy
              );
            }
          } else {
            PLAYER_STATS[playerName] = {
              round: parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.round),
              hero: event?.[OW_EVENT_KEYS.P_STAT]?.hero,
              heroList: [event?.[OW_EVENT_KEYS.P_STAT]?.hero],
              eliminations: event?.[OW_EVENT_KEYS.P_STAT]?.eliminations
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.eliminations)
                : 0,

              final_blows: event?.[OW_EVENT_KEYS.P_STAT]?.final_blows
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.final_blows)
                : 0,

              deaths: event?.[OW_EVENT_KEYS.P_STAT]?.deaths
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.deaths)
                : 0,

              hero_damage: event?.[OW_EVENT_KEYS.P_STAT]?.hero_damage
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.hero_damage)
                : 0,

              healing_dealt: event?.[OW_EVENT_KEYS.P_STAT]?.healing_dealt
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.healing_dealt)
                : 0,

              damage_taken: event?.[OW_EVENT_KEYS.P_STAT]?.damage_taken
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.damage_taken)
                : 0,

              damage_mitigated: event?.[OW_EVENT_KEYS.P_STAT]?.damage_mitigated
                ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.damage_mitigated)
                : 0,

              weapon_accuracy: event?.[OW_EVENT_KEYS.P_STAT]?.weapon_accuracy
                ? parseFloat(event?.[OW_EVENT_KEYS.P_STAT]?.weapon_accuracy)
                : 0,
            };
          }
        } else {
          // console.log("INITALIZING KILL VALUE TO PLAYER");
          PLAYER_STATS[playerName] = {
            round: parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.round),
            hero: event?.[OW_EVENT_KEYS.P_STAT]?.hero,
            heroList: [event?.[OW_EVENT_KEYS.P_STAT]?.hero],
            eliminations: event?.[OW_EVENT_KEYS.P_STAT]?.eliminations
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.eliminations)
              : 0,

            final_blows: event?.[OW_EVENT_KEYS.P_STAT]?.final_blows
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.final_blows)
              : 0,

            deaths: event?.[OW_EVENT_KEYS.P_STAT]?.deaths
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.deaths)
              : 0,

            hero_damage: event?.[OW_EVENT_KEYS.P_STAT]?.hero_damage
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.hero_damage)
              : 0,

            healing_dealt: event?.[OW_EVENT_KEYS.P_STAT]?.healing_dealt
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.healing_dealt)
              : 0,

            damage_taken: event?.[OW_EVENT_KEYS.P_STAT]?.damage_taken
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.damage_taken)
              : 0,

            damage_mitigated: event?.[OW_EVENT_KEYS.P_STAT]?.damage_mitigated
              ? parseInt(event?.[OW_EVENT_KEYS.P_STAT]?.damage_mitigated)
              : 0,

            weapon_accuracy: event?.[OW_EVENT_KEYS.P_STAT]?.weapon_accuracy
              ? parseFloat(event?.[OW_EVENT_KEYS.P_STAT]?.weapon_accuracy)
              : 0,
          };
        }
      }
    }
  }

  DTO["player_stats"] = PLAYER_STATS;

  return DTO;
};

const connectedClients: { socket: WebSocket; key: number }[] = [];

let newestLogFile;
let watcher: fs.StatWatcher;
const start = () => {
  newestLogFile = getMostRecentFileName(baseDir);

  console.log({ newestLogFile });

  if (newestLogFile) {
    const fullPath = `${baseDir}/${newestLogFile}`;
    watcher = fs.watchFile(
      fullPath,
      {
        bigint: false,
        persistent: true,
        interval: 1000,
      },
      (curr, prev) => {
        console.log("\nThe file was edited");

        // Show the time when the file was modified
        console.log("Previous Modified Time", prev.mtime);
        console.log("Current Modified Time", curr.mtime);

        const rawStringContent = fs.readFileSync(fullPath, "utf8");

        const eventArray = scrimCsvToArray(rawStringContent);
        // console.log(eventArray);
        events = eventArray;

        // for (const event of eventArray) {
        //   createDTO(event);
        // }

        const DTO = createDTO(eventArray);

        console.log(DTO);
        console.log("Sending DTO");
        for (const client of connectedClients) {
          if (client.socket.readyState === 1) {
            client.socket.send(JSON.stringify(DTO));
          }
        }
        oldEvents = events;
      }
    );
  } else {
    console.log("No log file to read from!");
  }
};

const PORT = 9009;

const HTTP_SERVER = createServer();

const WS_SERVER = new WebSocketServer({ server: HTTP_SERVER });

WS_SERVER.on("connection", (socket, req) => {
  connectedClients.push({ key: connectedClients.length, socket });
  console.log("Socket client connected", req.headers.origin);
  // start(socket);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected due to ${reason}`);
  });

  socket.on("message", (data) => {
    console.log(data);
    if (data === "START") {
      console.log("Starting logger");
      start();
    }
    if (data === "STOP" || data === "stop") {
      if (newestLogFile) {
        console.log("Stopping");
        watcher.removeAllListeners();
        fs.unwatchFile(newestLogFile);
      }
    }
  });

  socket.on("close", (code, reason) => {
    console.log("Socket client disconnected", code, reason);
  });
});

HTTP_SERVER.listen(PORT, () => {
  console.log("LISTENING ON " + PORT);
});
