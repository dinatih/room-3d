/**
 * Exemple de client WebSocket Home Assistant pour Room-3D
 * Utilise le package officiel: home-assistant-js-websocket
 * npm install home-assistant-js-websocket
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  Connection,
  HassEntities,
} from "home-assistant-js-websocket";

export class HomeAssistantService {
  private connection: Connection | null = null;
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  /**
   * Initialise la connexion WebSocket avec le token longue durée
   */
  async connect(onEntitiesUpdate: (entities: HassEntities) => void): Promise<Connection> {
    const auth = createLongLivedTokenAuth(this.url, this.token);
    this.connection = await createConnection({ auth });

    console.log("Connecté à Home Assistant via WebSocket");

    // S'abonne aux changements d'état en temps réel
    subscribeEntities(this.connection, (entities) => {
      onEntitiesUpdate(entities);
    });

    return this.connection;
  }

  /**
   * Bascule l'état d'une lumière (toggle)
   */
  async toggleLight(entityId: string) {
    if (!this.connection) return;
    await callService(this.connection, "light", "toggle", {
      entity_id: entityId,
    });
  }

  /**
   * Allume une lumière avec luminosité et couleur spécifique
   */
  async turnOnLight(entityId: string, brightnessPercent: number, rgbColor?: [number, number, number]) {
    if (!this.connection) return;
    const serviceData: Record<string, unknown> = {
      entity_id: entityId,
      brightness_pct: brightnessPercent,
    };
    if (rgbColor) {
      serviceData.rgb_color = rgbColor;
    }
    await callService(this.connection, "light", "turn_on", serviceData);
  }

  /**
   * Bascule un interrupteur / switch
   */
  async toggleSwitch(entityId: string) {
    if (!this.connection) return;
    await callService(this.connection, "switch", "toggle", {
      entity_id: entityId,
    });
  }
}
