const auth = () => ({
  signInWithPhoneNumber: jest.fn().mockResolvedValue({
    confirm: jest.fn().mockResolvedValue({ user: { uid: 'test-user' } }),
  }),
});

module.exports = auth;
module.exports.default = auth;
