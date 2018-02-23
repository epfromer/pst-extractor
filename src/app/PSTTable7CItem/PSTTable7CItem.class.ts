import { PSTTableItem } from "../PSTTableItem/PSTTableItem.class";

// Items found in the 7c tables
export class PSTTable7CItem extends PSTTableItem {
    public toString(): string {
        return "7c Table Item: " + super.toString();
    }
}
