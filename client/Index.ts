import * as ko from "knockout";
import * as React from "react";
import * as SocketIOClient from "socket.io-client";

import { env, LoadEnvironment } from "./Environment";
import { LauncherViewModel } from "./LauncherViewModel";
import { ReactPlayerView } from "./PlayerView/ReactPlayerView";
import { render as renderReact } from "react-dom";
import { InitializeSettings, CurrentSettings } from "./Settings/Settings";
import { TrackerViewModel } from "./TrackerViewModel";
import { RegisterBindingHandlers } from "./Utility/CustomBindingHandlers";
import { LegacySynchronousLocalStore } from "./Utility/LegacySynchronousLocalStore";
import { App } from "./App";
import { Metrics } from "./Utility/Metrics";

window.onload = async () => {
  LoadEnvironment();
  RegisterBindingHandlers();
  InitializeSettings();
  if (document.getElementById("tracker")) {
    await LegacySynchronousLocalStore.MigrateItemsToStore();
    if (env.HasEpicInitiative) {
      const customEncounterId = CurrentSettings().PlayerView.CustomEncounterId;
      if (customEncounterId.length) {
        env.EncounterId = customEncounterId;
      }
    }
    const viewModel = new TrackerViewModel(
      SocketIOClient.io({
        transports: ["websocket"]
      })
    );

    const container = document.getElementById("app__container");
    if (!container) {
      throw "#app__container not found";
    }
    renderReact(React.createElement(App, { tracker: viewModel }), container);

    viewModel.ImportEncounterIfAvailable();
    viewModel.ImportFromQueryParamIfAvailable();
    viewModel.GetWhatsNewIfAvailable();
    Metrics.TrackLoad();
  }

  if (document.getElementById("playerview") && !document.getElementById("kiosk__container")) {
    const encounterId = env.EncounterId;
    const container = document.getElementById("playerview__container");
    if (!container) {
      throw "#playerview__container not found";
    }
    const playerView = new ReactPlayerView(container, encounterId);
    playerView.LoadEncounterFromServer();
    playerView.ConnectToSocket(
      SocketIOClient.io({
        transports: ["websocket"]
      })
    );
  }

  if (document.getElementById("kiosk__container")) {
    const kioskContainer = document.getElementById("playerview__container")!;
    const kioskIdle = document.getElementById("kiosk__idle")!;
    const socket = SocketIOClient.io({ transports: ["websocket"] });
    let currentPlayerView: ReactPlayerView | null = null;
    let currentEncounterId: string | null = null;

    const showIdle = () => {
      kioskIdle.style.display = "";
      kioskContainer.style.display = "none";
    };

    const showEncounter = () => {
      kioskIdle.style.display = "none";
      kioskContainer.style.display = "";
    };

    const joinEncounter = (encounterId: string) => {
      if (currentPlayerView) {
        currentPlayerView.Disconnect();
      }
      if (currentEncounterId) {
        socket.emit("leave encounter", currentEncounterId);
      }
      currentEncounterId = encounterId;
      currentPlayerView = new ReactPlayerView(kioskContainer, encounterId);
      currentPlayerView.LoadEncounterFromServer();
      currentPlayerView.ConnectToSocket(socket);
      showEncounter();
    }

    socket.on("active encounter changed", (encounterId: string | null) => {
      if (encounterId && encounterId !== currentEncounterId) {
        joinEncounter(encounterId);
      } else if (!encounterId) {
        if (currentPlayerView) {
          currentPlayerView.Disconnect();
        }
        currentEncounterId = null;
        currentPlayerView = null;
        showIdle();
      }
    });

    // Check for an already-active encounter on load
    socket.emit(
      "get active encounter",
      (encounterId: string | null) => {
        if (encounterId) {
          joinEncounter(encounterId);
        } else {
          showIdle();
        }
      }
    );
  }

  if (document.getElementById("landing")) {
    const launcherViewModel = new LauncherViewModel();
    ko.applyBindings(launcherViewModel, document.body);
  }

  const loadingSplash = document.querySelector<HTMLElement>(".loading-splash");
  if (loadingSplash) {
    loadingSplash.style.display = "none";
  }
};
