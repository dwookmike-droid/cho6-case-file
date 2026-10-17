// 무료코스 설정. 공개용(publishable) 키만 둔다. service_role 키는 절대 넣지 않는다.
window.FC_CONFIG = {
  sync: true,                       // false 로 바꾸면 서버로 아무것도 보내지 않는다
  url: "https://abaakjkidxsnfigqfcbx.supabase.co",
  key: "sb_publishable_v1VeCcFo-iQzeP4tpug0ew_AIkyzaSI",
  course: "cho6",
  bucket: "fc-recordings",
  teacherPin: "0000",               // ?teacher=1 로 열고 이 번호를 넣으면 모든 날이 열린다. 꼭 바꿀 것
  teacher: "",                      // 수료증·리포트의 담당 선생님 이름
  unlockRule: "done"                // "nextday": 다음 날짜(자정)에 열림, "done": 끝내면 바로 열림
};
