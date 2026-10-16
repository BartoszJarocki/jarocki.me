import { shakespeare } from '../ml/gpt';
import { places } from './gptPlaces';
import { Still as LetterStill, letterSpace } from './letterSpaceScene';
import { pca } from './pca';

export default letterSpace({ model: 'gpt', project: pca });

export function Still() {
  return <LetterStill places={places} symbols={shakespeare.symbols} />;
}
