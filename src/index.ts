import fs from "fs";
import _ from "lodash";
import * as path from "path";
import peg from "pegjs";

import ConversionsUtils from "./helpers/conversions";

export interface IRecipeResult {
  result?: {
    instruction: string;
    unit: number;
    amount: string;
    ingredient: string;
  };
  unknown: {
    instruction?: string;
    reasons?: UNKNOWN_REASONS[];
  };
}

export enum LOGIC_OPERATOR {
  AND = "AND",
  OR = "OR"
}

export enum LANGUAGES {
  EN = "EN",
  FR = "FR"
}

export enum UNKNOWN_REASONS {
  PARSING = "mismatch during parsing",
  PARSING_AMOUNT = "unknown amount",
  PARSING_UNIT = "unknown unit",
  NO_ENTRY = "unavailable ingredient"
}

export interface IInputIngredient {
  recipeStr?: string;
  label?: string;
  quantity?: number;
}

export default class RecipesParser {
  private nlpParser: peg.Parser = peg.generate(
    fs.readFileSync(
      path.join(__dirname, `/../nlp/nlp-rules/rules_${this.langage}.pegjs`),
      {
        encoding: "utf8"
      }
    )
  );
  constructor(private langage: "FR" | "EN") {}

  public getIngredientsFromText(
    recipeInstructions: string[],
    returnUnitKey?: boolean
  ): IRecipeResult[] {
    const output: IRecipeResult = {
      unknown: {}
    };

    // Parse and normalize the ingredients
    return _.map(recipeInstructions, (instruction: string) => {
      const recipeStr = instruction
        .replace("½", "1/2")
        .replace("⅓", "1/3")
        .replace("¼", "1/4")
        .replace("¾", "3/4")
        .replace("⅔", "2/3");
      const parts = this.nlpParser.parse(recipeStr);

      if (
        typeof parts.amount === "undefined" ||
        typeof parts.ingredient === "undefined"
      ) {
        const unknownReasons = [UNKNOWN_REASONS.PARSING];
        if (!parts.amount) {
          unknownReasons.push(UNKNOWN_REASONS.PARSING_AMOUNT);
        }

        output.unknown = {
          instruction,
          reasons: unknownReasons
        };
        return output;
      } else {
        parts.amount = ConversionsUtils.normalizeAmount(
          this.langage,
          parts.amount
        );

        // get unit key match
        if (returnUnitKey) {
          parts.unit = ConversionsUtils.getUnitKey(parts.unit);
        }

        output.result = {
          instruction,
          unit: parts.unit,
          amount: parts.amount,
          ingredient: parts.ingredient
        };
        return output;
      }
    });
  }
}
