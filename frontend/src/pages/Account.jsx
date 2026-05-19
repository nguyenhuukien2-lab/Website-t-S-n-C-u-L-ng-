import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.darker};
  padding: 4rem 2rem;
`;

const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  text-align: center;
`;

const AuthForm = styled(motion.form)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: linear-gradient(135deg, ${props => props.theme.dark}, ${props => props.theme.darker});
  border: 2px solid ${props => props.theme.primary};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 0 30px ${props => props.theme.glow};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: ${props => props.theme.dark};
  border: 2px solid ${props => props.theme.dark};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 15px ${props => props.theme.glow};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const SubmitButton = styled.button`
  padding: 12px;
  background: ${props => props.theme.primary};
  color: ${props => props.theme.darker};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px ${props => props.theme.glow};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 30px ${props => props.theme.glow};
    background: ${props => props.theme.secondary};
  }
`;

const ToggleText = styled.p`
  color: ${props => props.theme.textSecondary};
  text-align: center;
  margin-top: 1rem;

  a {
    color: ${props => props.theme.primary};
    cursor: pointer;
    font-weight: 600;

    &:hover {
      color: ${props => props.theme.secondary};
    }
  }
`;

export const Account = () => {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Auth data:', formData);
    alert(isLogin ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
  };

  return (
    <PageContainer theme={theme}>
      <Container>
        <Title theme={theme}>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</Title>

        <AuthForm
          theme={theme}
          as={motion.form}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
        >
          {!isLogin && (
            <FormGroup>
              <Label theme={theme}>Họ và Tên</Label>
              <Input
                theme={theme}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên của bạn"
                required
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label theme={theme}>Email</Label>
            <Input
              theme={theme}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Mật Khẩu</Label>
            <Input
              theme={theme}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </FormGroup>

          {!isLogin && (
            <FormGroup>
              <Label theme={theme}>Xác Nhận Mật Khẩu</Label>
              <Input
                theme={theme}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Xác nhận mật khẩu"
                required
              />
            </FormGroup>
          )}

          <SubmitButton theme={theme}>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</SubmitButton>
        </AuthForm>

        <ToggleText theme={theme}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <a onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </a>
        </ToggleText>
      </Container>
    </PageContainer>
  );
};
