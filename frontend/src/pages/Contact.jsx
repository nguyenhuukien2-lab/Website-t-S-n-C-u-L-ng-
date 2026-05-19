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
  max-width: 600px;
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

const Form = styled(motion.form)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const Textarea = styled.textarea`
  padding: 12px 16px;
  background: ${props => props.theme.dark};
  border: 2px solid ${props => props.theme.dark};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
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

const SuccessMessage = styled(motion.div)`
  background: ${props => props.theme.primary}20;
  border: 2px solid ${props => props.theme.primary};
  color: ${props => props.theme.secondary};
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
`;

export const Contact = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <PageContainer theme={theme}>
      <Container>
        <Title theme={theme}>Liên Hệ Với Chúng Tôi</Title>

        {submitted && (
          <SuccessMessage
            theme={theme}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ✓ Cảm ơn bạn! Chúng tôi sẽ sớm liên hệ lại với bạn.
          </SuccessMessage>
        )}

        <Form
          theme={theme}
          as={motion.form}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
        >
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

          <FormGroup>
            <Label theme={theme}>Email</Label>
            <Input
              theme={theme}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email của bạn"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Chủ Đề</Label>
            <Input
              theme={theme}
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Nhập chủ đề"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Tin Nhắn</Label>
            <Textarea
              theme={theme}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Nhập tin nhắn của bạn"
              required
            />
          </FormGroup>

          <SubmitButton theme={theme}>Gửi</SubmitButton>
        </Form>
      </Container>
    </PageContainer>
  );
};
