import moment from 'moment-timezone';
import humanizeDuration from "humanize-duration";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import util from 'util';
import { ActionRowBuilder, Attachment, ComponentType, Guild, PermissionFlagsBits, PermissionsBitField, SnowflakeUtil } from 'discord.js';
import { client } from '../index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let root = null;
moment.tz.setDefault('Asia/Riyadh');
moment.updateLocale('en', {
    week: {
        dow: 0, // الأحد (0) هو أول يوم في الأسبوع
        doy: 6  // يوم السنة الذي يتم استخدامه لتحديد الأسبوع الأول (السبت هو آخر يوم)
    }
});
export function findProjectRoot(): string {
    let dir = __dirname;
    if (!root) {
        while (!fs.existsSync(path.join(dir, 'package.json'))) {
            const parentDir = path.dirname(dir);
            if (parentDir === dir) break; // We have reached the root, no package.json found
            dir = parentDir;
        }
        root = dir;

        return dir;
    }
    else return root


}


const isValidSnowflake = (str: string): boolean => {
    return /^\d{17,19}$/.test(str); // Snowflakes are 17–19 digit numbers
};

export const isValidDiscordToken = (token: string): boolean => {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
        const userId = atob(parts[0]);
        return isValidSnowflake(userId);
    } catch {
        return false; // atob failed (invalid base64)
    }
};


const customFormats: Record<string, (timestampSeconds: number) => string> = {
    Date: (timestampSeconds) => `<t:${timestampSeconds}:d> <t:${timestampSeconds}:t> `,
};



export function formatDiscordTimestamp(
    timestampMs: number,
    styleOrFormat: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | string | ((timestampSeconds: number) => string) = 'R',
    additionalFormats: Record<string, (timestampSeconds: number) => string> = {}
): string {
    const timestampSeconds = Math.floor(timestampMs / 1000);


    const allFormats = { ...customFormats, ...additionalFormats };


    if (typeof styleOrFormat === 'function') {
        return styleOrFormat(timestampSeconds);
    }


    if (allFormats[styleOrFormat]) {
        return allFormats[styleOrFormat](timestampSeconds);
    }


    if (['t', 'T', 'd', 'D', 'f', 'F', 'R'].includes(styleOrFormat)) {
        return `<t:${timestampSeconds}:${styleOrFormat}>`;
    }


    return `<t:${timestampSeconds}:R>`;
}
export const formatFuration = (time, lang) => humanizeDuration(time, { language: lang || "en", round: true, units: ["y", "mo", "w", "d", "h", "m", "s"] }) || "0";
export function uppercaseFirstLetter(str): string {
    if (!str) return str; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}

declare global {
    interface Console {
        fullLog: (object: any) => void;
    }
}
console.fullLog = function (object: any): void {
    // @ts-ignore
    console.log(util.inspect(object, { depth: null, colors: true }));
};
export const isValidSnowFlake = (snowflake: string): boolean => {
    try {
        const id = SnowflakeUtil.timestampFrom(snowflake);
        return !isNaN(id);

    } catch (error) {
        return false;

    }
}


export function hideSensitive(
    text: string,
    visibleCount: number = 4,
    maskChar: string = '*'
): string {
    if (typeof text !== 'string') return '';

    const visible = text.slice(0, visibleCount); // أول كم حرف
    const masked = maskChar.repeat(Math.max(0, text.length - visibleCount)); // إخفاء الباقي

    return visible + masked;
}



export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isValidToken = (token: string): boolean => {
    const firstCheck = token.split(".").length === 3;
    const secondCheck = token.split(".").every((part) => part.length > 0);
    const decodeFirstPart = Buffer.from(token.split(".")[0], "base64").toString().trim()
    const checkDate = isValidSnowFlake(decodeFirstPart);

    return firstCheck && secondCheck && checkDate;

}
export function numberToHexColor(num: number): string {
    // تأكد من أن الرقم ضمن النطاق الصحيح (0 إلى 16777215)
    if (num < 0 || num > 0xFFFFFF) {
        throw new Error("الرقم يجب أن يكون بين 0 و 16777215.");
    }

    // تحويل الرقم إلى تنسيق HEX وإزالة أي أصفار زائدة
    const hexColor = num.toString(16).padStart(6, '0');

    // إضافة "#" في البداية
    return `#${hexColor}`;
}
export function disableComponents(components: any, defult?: String | String[]) {
    let componentsArray = components.map(d => {

        let x = d.components.map((c) => {
            c.data.disabled = true

            if (c.type === ComponentType.StringSelect && defult && c.data.options.find(d => defult.includes(d.value))) {
                c.data.options = c.data.options.map(o => ({ ...o, default: defult.includes(o.value) }));
            };
            return c;
        });
        return new ActionRowBuilder<any>().setComponents(x);
    })
    return componentsArray

}
export  type perm = keyof typeof PermissionFlagsBits;

export function chunk<T>(array: T[], size: number): T[][] {
    if (size <= 0) throw new Error("Chunk size must be greater than 0.");

    const result: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        result.push(chunk);
    }

    return result;
}
export interface memberTranscript {
    id: string,
    value: number
}
export interface genrateChannelTranscriptInterface {
    file: Attachment | any,
    members: memberTranscript[]
}
export function cleanJsonArrayString(input: string): string[] {
    let result = input;
    while (typeof result === "string") {
        try {
            result = JSON.parse(result);
        } catch (err) {
            break;
        }
    }
    if (Array.isArray(result)) {
        return result;
    }
    throw new Error("Failed to parse into array");
}
export function formatTicketNumber(num: number, length: number = 4): string {
    return num.toString().padStart(length, '0');
}




export function getGuildIcon(guild: Guild) {
    return guild.icon ? guild.iconURL() : client.user.displayAvatarURL();
}