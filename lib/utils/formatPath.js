import path from 'path';

const formatPath = (source, file) => path.relative(source, file);

export default formatPath;
