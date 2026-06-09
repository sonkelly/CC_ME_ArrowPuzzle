import { Color } from "cc";
import { ItemColor } from "./GridItem";

export class ArrowGameConfig {
    public static moveLen: number = 4;
    public static maxDis: number = 1;
    public static arrowScore: number = 240;
    public static arrowColors: Color[] = [
        (new Color()).fromHEX("#fccc00"),
        (new Color()).fromHEX("#d45b0a"),
        (new Color()).fromHEX("#4396da"),
        (new Color()).fromHEX("#57ebd3"),
        (new Color()).fromHEX("#be41d5"),
        (new Color()).fromHEX("#ca3454"),
        (new Color()).fromHEX("#34ca85"),
        (new Color()).fromHEX("#5e33c9")
    ];
    public static COLOR_NORMAL: Color = (new Color()).fromHEX(ItemColor.Normal);
    public static COLOR_ERROR1: Color = (new Color()).fromHEX(ItemColor.Error1);
    public static COLOR_ERROR2: Color = (new Color()).fromHEX(ItemColor.Error2);
    public static COLOR_SINGLE: Color = (new Color()).fromHEX(ItemColor.Single);
}