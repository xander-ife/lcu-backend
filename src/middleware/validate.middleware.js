// Runs a Zod schema against req.body (or req.query/params via opts)
const validate = (schema, source = "body") => (req, _res, next) => {
  const parsed = schema.parse(req[source]);
  req[source] = parsed;
  next();
};

module.exports = { validate };
