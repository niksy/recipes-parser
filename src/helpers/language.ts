import _ from "lodash";

export default class LanguageUtils {
  /**
   *
   * Removes accent from string
   * @param input
   *
   */
  public static removeAccentuation(input: string) {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}
