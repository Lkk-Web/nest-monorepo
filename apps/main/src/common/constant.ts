import {resolve} from 'path';


const srcPath = resolve(__dirname, '../');
const rootPath = resolve(__dirname, '../../');

export const pathConstant = {
  // root
  // ----------------------------
  root: rootPath,
  temp: `${rootPath}/temp`,
  logs: `${rootPath}/logs`,
  // src
  // ----------------------------
  src: srcPath,
  core: `${srcPath}/core`,
  common: `${srcPath}/common`,
  library: `${srcPath}/library`,
  modules: `${srcPath}/modules`,
  model: `${srcPath}/model`,
};

export const envConstant = {
  env: 'NODE_ENV',
  port: 'NODE_PORT',
  appName: 'NODE_APP_NAME',
};

export const secretConstant = {
  jwt: 'NODE_USER_CENTER_JWT',
  sha256: 'NODE_USER_CENTER_SHA256',
};

export const headersConstant = {
  requestId: 'x-request-id',
  requestToken: 'x-request-token',
  requestUserId: 'x-request-user-id',
};



export const GIT_CI_ORDER = ["$更新服务$"] //

