
import { Schema, model, Document } from "mongoose";
import { Sequelize, DataTypes, Model } from "sequelize";

// ======================
// Mongo Schema
// ======================

export interface ITicket extends Document {
  channelId: string;
  guildId: string;
  ownerId: string;
  addedMembers: string[];
  addedRoles: string[];
  firstTicketMessage?: string | null; // Optional field for MongoDB
  secondTicketMessage?: string | null; // Optional field for MongoDB
  ticketName: string;
  ticketNumber: number;
  ticketStaff: string;
  claim: boolean;
  close: boolean;
  deleted: boolean;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
  addedMembers: { type: [String], default: [] },
  addedRoles: { type: [String], default: [] },
  ticketName: { type: String, required: true },
  ticketNumber: { type: Number, default: 0 },
  ticketStaff: { type: String, default: null },
  firstTicketMessage: { type: String, default: null }, // Optional field for MongoDB
  secondTicketMessage: { type: String, default: null }, // Optional field for MongoDB
  claim: { type: Boolean, default: false },
  close: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const TicketMongo = model<ITicket>("Ticket", TicketSchema);

// ======================
// Sequelize Model
// ======================

export class TicketSQL extends Model {
  public channelId!: string;
  public guildId!: string;
  public ownerId!: string;
  public addedMembers!: any; 
  public addedRoles!: any;  
  public ticketName!: string;
  public ticketNumber!: number;
  public ticketStaff!: string | null;
  public claim!: boolean;
  public close!: boolean;
  public deleted!: boolean;
  public firstTicketMessage!: string | null;
  public secondTicketMessage!: string | null; // Optional field for Sequelize
  public createdAt!: Date;
}

export function initTicketSQL(sequelize: Sequelize) {
  TicketSQL.init(
    {
      channelId: { type: DataTypes.STRING, allowNull: false,unique:false },
      guildId: { type: DataTypes.STRING, allowNull: false,unique:false },
      ownerId: { type: DataTypes.STRING, allowNull: false,unique:false },
      addedMembers: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      addedRoles: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      ticketName: { type: DataTypes.STRING, allowNull: false },
      ticketNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ticketStaff: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      claim: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      firstTicketMessage: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      secondTicketMessage: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      close: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize: sequelize,
      tableName: "Tickets",
    }
  );
}
