function joinGroup(){
  // sql query with info of logged in user passed through
  con.query('insert into ppuclubs.UserInfo(UserFirstName, UserLastName, UserPhoneNumber, UserEmail, UserPassword) values("Alex", "McMahon", "45687463545", "test2@test.com", "Password");')
}
