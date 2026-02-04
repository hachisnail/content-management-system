export const validate = (schema) => async (req, res, next) => {
  try {
    const parsedBody = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    req.body = parsedBody;
    next();
  } catch (error) {
    const validationError = new Error("Validation Error");
    validationError.status = 400;

    validationError.details = error.inner.map((e) => ({
      field: e.path,
      message: e.message,
    }));


    next(validationError);
  }
};
