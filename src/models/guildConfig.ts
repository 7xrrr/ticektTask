import { Schema, model, Document } from "mongoose";
import { Sequelize, DataTypes, Model } from "sequelize";
import { DatabaseMiddleware } from "../core/databaseMiddleware.js";

// ======================
// Mongo Schema
// ======================


export interface IGuildConfig extends Document {
  guildId: string;
  ticketCategory: string;
  staffRoles: string[];
  logChannelId: string;
  ticketNumber?: number; // Optional field for ticket number
  createdAt: Date;
}

const GuildConfigSchema = new Schema<IGuildConfig>({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  ticketCategory: {
    type: String,
    default: null,
  },
  staffRoles: {
    type: [String],
    default: [],
  },
  ticketNumber: {
    type: Number,
    default: 0, // Default ticket number starts at 0
  },
  logChannelId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GuildConfigMongo = model<IGuildConfig>("GuildConfig", GuildConfigSchema);


// ======================
// Sequelize Model
// ======================

export class GuildConfigSQL extends Model {
  public guildId!: string;
  public ticketCategory!: string | null;
  public staffRoles!: any; 
  public logChannelId!: string | null;
  public ticketNumber!: number; 
  public createdAt!: Date;
}
export function initGuildConfigSQL(sequelize: Sequelize) {
GuildConfigSQL.init(
  {
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    ticketCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    ticketNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    },
    staffRoles: {
      type: DataTypes.JSON, 
      allowNull: false,
      defaultValue: [],
    },
    logChannelId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelize,
    tableName: "GuildConfigs",
  }
);
}