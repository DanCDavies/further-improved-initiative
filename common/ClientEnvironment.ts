export interface ClientEnvironment {
  EncounterId: string;
  PostedEncounter: { Combatants: {}[] } | null;
  IsLoggedIn: boolean;
  HasStorage: boolean;
  HasEpicInitiative: boolean;
  HasMythic: boolean;
  BaseUrl: string;
  PatreonLoginUrl: string;
  SendMetrics: boolean;
  SentryDSN: string | null;
}
