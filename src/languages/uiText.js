import English from './uiText/english';
import Hindi from './uiText/hindi';
import Kannada from './uiText/kannada';
import Tamil from './uiText/tamil';
import Telugu from './uiText/telugu';
import Punjabi from './uiText/punjabi';
import Malayalam from './uiText/malayalam';
import Marathi from './uiText/marathi';
import Bengali from './uiText/bengali';
import Gujarati from './uiText/gujarati';
import Odia from './uiText/odia';
import Assamese from './uiText/assamese';
import Urdu from './uiText/urdu';

const UI_TEXT = {
  English,
  Hindi,
  Kannada,
  Tamil,
  Telugu,
  Punjabi,
  Malayalam,
  Marathi,
  Bengali,
  Gujarati,
  Odia,
  Assamese,
  Urdu,
};

export function t(language, key, params = {}) {
  const table = UI_TEXT[language] || UI_TEXT.English;
  const template = table[key] || UI_TEXT.English[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, variable) => {
    const value = params[variable];
    return value == null ? '' : String(value);
  });
}
