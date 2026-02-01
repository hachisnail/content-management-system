export const validate = (schema) => async (req, res, next) => {
  try {
    const parsedBody = await schema.validate(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });
    
    req.body = parsedBody;
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: error.inner.map(e => ({ 
        field: e.path, 
        message: e.message 
      })) 
    });
  }
};