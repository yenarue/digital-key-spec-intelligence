import 'server-only';
import v1 from '../../../../data/demo/spec-v1.json';
import v2 from '../../../../data/demo/spec-v2.json';
import { MiniSearchRetriever, SyntheticCorpusProvider } from '@dksi/spec-core';

export const corpus = new SyntheticCorpusProvider([v1, v2]);
export const retriever = new MiniSearchRetriever(corpus);
