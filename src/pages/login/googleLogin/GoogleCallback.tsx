import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { s } from "./style";
import { useDispatch } from "react-redux";
import { setUserInfo } from "src/components/Redux/Slices/userInfoSlice";
//import ErrorModal from "src/components/ErrorModal/ErrorModal";
interface UserInfoResponse {
  requireInfo: string; //소셜 로그인을 해서 회원가입이 되어있는지 확인. 그래서 홈으로 넘길지, 추가정보 입력 페이지로 넘길지 판단 하기 위해 받는 값
  userId: string;

  userName: string;
  enlistmentYear: string;
  enlistmentMonth: string;
  enlistmentDay: string;
  completionYear: string;
  completionMonth: string;
  completionDay: string;
}

function GoogleCallback() {
  const dispatch = useDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [modalErrorContent, setModalErrorContent] =
    useState<React.ReactNode>(null); // 모달에 표시될 내용을 저장합니다.

  const handleOAuthGoogle = async (code: string) => {
    try {
      // 구글로부터 받아온 code를 서버에 전달하고 구글로 회원가입 & 로그인한다
      const response = await axios.get<UserInfoResponse>(
        `http://localhost:8080/api/oauth/login/google?code=${code}`
      );
      if (response.status === 200) {
        const accessToken = response.headers["authorization"];
        const refreshToken = response.headers["reauthorization"];
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        if (response.data.requireInfo == "false") {
          dispatch(
            setUserInfo({
              userName: response.data.userName,
              enlistmentYear: response.data.enlistmentYear,
              enlistmentMonth: response.data.enlistmentMonth,
              enlistmentday: response.data.enlistmentDay,
              completionYear: response.data.enlistmentYear,
              completionMonth: response.data.completionMonth,
              completionday: response.data.completionDay,
            })
          );
        }

        console.log("refreshToken");
        console.log(response.headers.refreshToken);
        console.log("refreshToken----");
        console.log("accessToken");
        console.log(response.headers.accessToken);
        console.log("accessToken----");
        console.log(response.headers);
        try {
          const userResponse = await axios.get(
            `http://localhost:8080/api/users`,
            {
              headers: {
                authorization: `${accessToken}`,
              },
            }
          );
          if (userResponse.status === 200) {
            localStorage.setItem("userId", userResponse.data.userId);
            //localStorage.setItem('email', userResponse.data.email);
            localStorage.setItem("userName", userResponse.data.userName);

            // navigate(`/home/${userResponse.data.userId}`, { replace: true }); // 인가 코드 제거 및 /OwnerHome/${email}로 리다이렉트
          }
          const userId = localStorage.getItem("userId");
          const returnUrl = localStorage.getItem("returnUrl");

          if (returnUrl) {
            // 저장된 URL로 리다이렉트합니다.
            navigate(returnUrl);
            localStorage.removeItem("returnUrl"); // 사용 후 저장된 URL을 삭제합니다.
          } else {
            // 저장된 URL이 없으면 기본 페이지(예: 사용자 홈)로 리다이렉트합니다.
            navigate(`/home/${userId}`, { replace: true }); // 인가 코드 제거 및 /OwnerHome/${email}로 리다이렉트
          }
        } catch (error: unknown) {
          console.log("유저정보 요청 실패"); //에러 일 경우
          if (error instanceof AxiosError) {
            const status = error?.response?.status;
            console.error("Failed to fetch user info:", error);
            setModalErrorContent(
              <s.ErrorCenterModalWrapper>
                <s.ErrorModalTextsWrapper2>
                  유저의 정보를
                </s.ErrorModalTextsWrapper2>
                <s.ErrorModalTextsWrapper2>
                  불러오지 못했어요.
                </s.ErrorModalTextsWrapper2>
                <s.ModalButton onClick={handleErrorModalClose}>
                  닫기
                </s.ModalButton>
              </s.ErrorCenterModalWrapper>
            );
            if (status === 404) {
              // 리소스를 찾을 수 없음
            } else if (status === 500) {
              // 서버 내부 오류
            } else {
              // 기타 상태 코드 처리
            }
          }
          setErrorModalOpen(true);
          navigate("/login");
          return null;
        }
      }
    } catch (error: unknown) {
      //에러 일 경우
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        console.error("Failed to fetch user info:", error);
        setModalErrorContent(
          <s.ErrorCenterModalWrapper>
            <s.ErrorModalTextsWrapper2>
              구글에서 정보를
            </s.ErrorModalTextsWrapper2>
            <s.ErrorModalTextsWrapper2>
              불러오지 못했어요.
            </s.ErrorModalTextsWrapper2>
            <s.ModalButton onClick={handleErrorModalClose}>닫기</s.ModalButton>
          </s.ErrorCenterModalWrapper>
        );
        if (status === 404) {
          // 리소스를 찾을 수 없음
        } else if (status === 500) {
          // 서버 내부 오류
        } else {
          // 기타 상태 코드 처리
        }
      }
      setErrorModalOpen(true);
      navigate("/login");
      return null;
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    if (code) {
      alert("CODE = " + code);
      handleOAuthGoogle(code);
    }

    if (!code) {
      alert("인증 코드 또는 상태 값이 없습니다.");
      navigate("/login");
      return;
    }
  }, []);

  const handleErrorModalClose = () => {
    navigate("/login");
  };

  return (
    <s.GoogleWrapper>
      로그인 중...
      {/* <ErrorModal isOpen={isErrorModalOpen} onClose={() => setErrorModalOpen(false)} >
          {modalErrorContent}
      </ErrorModal> */}
    </s.GoogleWrapper>
  );
}

export default GoogleCallback;
